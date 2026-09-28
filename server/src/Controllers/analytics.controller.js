import { Order } from "../Modals/order.modal.js";
import { Product } from "../Modals/product.modal.js";
import { Review } from "../Modals/review.modal.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Start of "today" in server-local time.
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Start of the current calendar month.
const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// YYYY-MM-DD key for a date (used to group orders by day).
const dayKey = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

// Total units in a single order.
const orderUnits = (order) =>
  (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

// ---------------------------------------------------------------------------
// GET /api/analytics/dashboard
// Aggregates sales, inventory, ratings and best-seller data from the real
// Order / Product / Review collections. Everything is computed with Mongo
// aggregation (or lightweight in-memory passes over already-fetched docs).
// ---------------------------------------------------------------------------
export const getDashboardAnalytics = async (req, res) => {
  try {
    // Optional window for the daily-sales chart (defaults to last 14 days).
    const days = Math.min(Math.max(Number(req.query.days) || 14, 7), 90);

    const todayStart = startOfToday();
    const monthStart = startOfMonth();

    // ---- Orders -----------------------------------------------------------
    // Fetch all orders once; the dataset is small enough to aggregate in
    // memory across the several views we need. (Swap to $facet for scale.)
    const orders = await Order.find({}).lean();

    // Only "real" revenue orders count towards sales figures. We include all
    // statuses here because even a "placed" order represents a sale; refunds
    // aren't modelled in this project.
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const totalUnitsSold = orders.reduce((sum, o) => sum + orderUnits(o), 0);
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    // Daily sales for the requested window ---------------------------------
    const windowStart = new Date(todayStart);
    windowStart.setDate(windowStart.getDate() - (days - 1));

    // Seed every day in the window with zero so the chart has no gaps.
    const dailyMap = new Map();
    for (let i = 0; i < days; i += 1) {
      const d = new Date(windowStart);
      d.setDate(d.getDate() + i);
      dailyMap.set(dayKey(d), { revenue: 0, orders: 0, units: 0 });
    }
    orders.forEach((order) => {
      const created = new Date(order.createdAt);
      if (created < windowStart) return;
      const key = dayKey(created);
      if (!dailyMap.has(key)) return;
      const bucket = dailyMap.get(key);
      bucket.revenue += order.total || 0;
      bucket.orders += 1;
      bucket.units += orderUnits(order);
    });
    const dailySales = [...dailyMap.entries()].map(([date, v]) => ({
      date,
      revenue: Number(v.revenue.toFixed(2)),
      orders: v.orders,
      units: v.units,
    }));

    // Today's + this month's revenue ---------------------------------------
    const todayRevenue = orders
      .filter((o) => new Date(o.createdAt) >= todayStart)
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const monthRevenue = orders
      .filter((o) => new Date(o.createdAt) >= monthStart)
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt) >= todayStart,
    ).length;

    // Order-status breakdown -----------------------------------------------
    const statusCounts = { placed: 0, processing: 0, shipped: 0, delivered: 0 };
    orders.forEach((o) => {
      if (statusCounts[o.status] !== undefined) statusCounts[o.status] += 1;
    });
    const statusBreakdown = Object.entries(statusCounts).map(
      ([status, count]) => ({ status, count }),
    );

    // ---- Products / inventory --------------------------------------------
    const products = await Product.find({})
      .populate("category", "name")
      .lean();

    let unitsInStock = 0;
    let inventoryRetailValue = 0;
    let outOfStock = 0;
    let lowStock = 0;
    const productById = new Map();

    products.forEach((product) => {
      const stock = (product.variants || []).reduce(
        (sum, v) => sum + (v.stock || 0),
        0,
      );
      unitsInStock += stock;
      inventoryRetailValue += stock * (product.price || 0);
      if (stock === 0) outOfStock += 1;
      else if (stock <= 5) lowStock += 1;

      productById.set(String(product._id), {
        title: product.title,
        price: product.price || 0,
        stock,
        category: product.category?.name || "Uncategorised",
        image: product.images?.[0] || "",
      });
    });

    // ---- Best sellers (today + this month) -------------------------------
    // Aggregate units + revenue per product from the order line items.
    const tally = (ordersSubset) => {
      const map = new Map();
      ordersSubset.forEach((order) => {
        (order.items || []).forEach((item) => {
          const key = String(item.product || item.title);
          const entry =
            map.get(key) ||
            {
              title: item.title,
              image: item.image || "",
              units: 0,
              revenue: 0,
            };
          entry.units += item.quantity || 0;
          entry.revenue += (item.price || 0) * (item.quantity || 0);
          map.set(key, entry);
        });
      });
      return [...map.values()]
        .sort((a, b) => b.units - a.units)
        .slice(0, 5)
        .map((e) => ({
          title: e.title,
          image: e.image,
          units: e.units,
          revenue: Number(e.revenue.toFixed(2)),
        }));
    };

    const ordersToday = orders.filter((o) => new Date(o.createdAt) >= todayStart);
    const ordersThisMonth = orders.filter(
      (o) => new Date(o.createdAt) >= monthStart,
    );
    const bestSellersToday = tally(ordersToday);
    const bestSellersMonthly = tally(ordersThisMonth);

    // Also expose an all-time best seller list as a useful extra.
    const bestSellersAllTime = tally(orders);

    // ---- Ratings ----------------------------------------------------------
    const reviews = await Review.find({}).lean();
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let reviewSum = 0;
    reviews.forEach((review) => {
      const r = Math.round(review.rating || 0);
      if (r >= 1 && r <= 5) {
        ratingCounts[r] += 1;
        reviewSum += review.rating;
      }
    });
    const avgRating = reviews.length ? reviewSum / reviews.length : 0;
    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
      star: `${star}`,
      count: ratingCounts[star],
    }));

    // ---- Revenue by category ---------------------------------------------
    const categoryRevenueMap = new Map();
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const info = productById.get(String(item.product));
        const category = info?.category || "Uncategorised";
        const prev = categoryRevenueMap.get(category) || 0;
        categoryRevenueMap.set(
          category,
          prev + (item.price || 0) * (item.quantity || 0),
        );
      });
    });
    const categorySales = [...categoryRevenueMap.entries()]
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);

    // ---- Top rated products ----------------------------------------------
    const ratingByProduct = new Map();
    reviews.forEach((review) => {
      const key = String(review.productId);
      const entry = ratingByProduct.get(key) || { sum: 0, count: 0 };
      entry.sum += review.rating || 0;
      entry.count += 1;
      ratingByProduct.set(key, entry);
    });
    const topRatedProducts = [...ratingByProduct.entries()]
      // Skip reviews that point at products which no longer exist, so the
      // chart only ever shows real catalogue items.
      .filter(([productId]) => productById.has(productId))
      .map(([productId, { sum, count }]) => ({
        name: productById.get(productId).title,
        rating: Number((sum / count).toFixed(2)),
        reviews: count,
      }))
      .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
      .slice(0, 6);

    return res.status(200).json({
      success: true,
      message: "Fetched dashboard analytics successfully",
      data: {
        summary: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalOrders,
          totalUnitsSold,
          avgOrderValue: Number(avgOrderValue.toFixed(2)),
          todayRevenue: Number(todayRevenue.toFixed(2)),
          todayOrders,
          monthRevenue: Number(monthRevenue.toFixed(2)),
          totalProducts: products.length,
          totalReviews: reviews.length,
          unitsInStock,
          inventoryRetailValue: Number(inventoryRetailValue.toFixed(2)),
          outOfStock,
          lowStock,
          avgRating: Number(avgRating.toFixed(2)),
        },
        dailySales,
        statusBreakdown,
        categorySales,
        ratingDistribution,
        bestSellersToday,
        bestSellersMonthly,
        bestSellersAllTime,
        topRatedProducts,
      },
    });
  } catch (err) {
    console.error("getDashboardAnalytics error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
