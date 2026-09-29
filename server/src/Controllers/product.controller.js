import mongoose from "mongoose";
import { Product } from "../Modals/product.modal.js";
import { Order } from "../Modals/order.modal.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

// Order statuses that are NOT real sales (money returned / item coming back /
// exchanged). Excluded when computing best sellers, matching the analytics.
const NON_SALES_STATUSES = [
  "cancelled",
  "refunded",
  "return_in_transit",
  "replacement_requested",
  "replacement_out",
  "replacement_completed",
];

// Start of the current calendar month (server-local time).
const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// String arrays (e.g. existingImages) arrive as JSON strings too
const parseStringArray = (raw) => {
  if (raw === undefined) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : null;
  } catch {
    return null;
  }
};

// Variants arrive as a JSON string in multipart form data
const parseVariants = (raw) => {
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  return parsed.map((variant) => ({
    color: variant.color,
    size: variant.size,
    stock: Number(variant.stock),
  }));
};

// CREATE PRODUCT (post)
export const createProduct = async (req, res) => {
  try {
    const images = [];
    if (req.files && req.files.length > 0) {
      const results = await Promise.all(
        req.files.map((file) =>
          uploadToCloudinary(file.buffer, "ecommerce/products"),
        ),
      );
      results.forEach((result) => images.push(result.secure_url));
    }
    const variants = parseVariants(req.body.variants);
    if (variants === null) {
      return res.status(400).json({
        success: false,
        message: "Variants must be a valid JSON array",
      });
    }
    const createdProduct = await Product.create({
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      subcategory: req.body.subcategory,
      images: images,
      slug: req.body.slug,
      rating: Number(req.body.rating) || 0,
      variants: variants,
      isFeatured: req.body.isFeatured === "true",
    });
    return res.status(201).json({
      success: true,
      message: "Created produc successfully",
      data: createdProduct,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET ALL PRODUCTS (get)
export const getProduct = async (req, res) => {
  try {
    const allProducts = await Product.find({}).populate(
      "category subcategory",
    );
    return res.status(200).json({
      success: true,
      message: "Fetched all products successfully",
      data: allProducts,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET TOP SELLING PRODUCTS THIS MONTH (get) — public storefront.
// Ranks products by units sold in the current calendar month, computed from
// real order line items (never static data), then joins each ranking back to
// the live Product collection so the cards show current title / image / price.
// Query: ?limit=4&period=month|today|all
export const getTopSellingProducts = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 4, 1), 24);
    const period = req.query.period || "month";

    // Time window for "real sales".
    let since = null;
    if (period === "today") {
      since = new Date();
      since.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      since = startOfMonth();
    } // "all" → no date filter

    const orderMatch = { status: { $nin: NON_SALES_STATUSES } };
    if (since) orderMatch.createdAt = { $gte: since };

    // Aggregate units + revenue per product from order line items.
    const ranked = await Order.aggregate([
      { $match: orderMatch },
      { $unwind: "$items" },
      { $match: { "items.product": { $ne: null } } },
      {
        $group: {
          _id: "$items.product",
          units: { $sum: "$items.quantity" },
          revenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          // Keep a snapshot title/image as a fallback if the product was deleted.
          snapshotTitle: { $first: "$items.title" },
          snapshotImage: { $first: "$items.image" },
          // Most recent colour purchased, used for the card subtitle.
          lastColor: { $last: "$items.color" },
        },
      },
      { $sort: { units: -1, revenue: -1 } },
      { $limit: limit },
    ]);

    if (ranked.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No sales in the selected period yet",
        data: [],
      });
    }

    // Join the rankings back to live products so the cards are always current.
    const productIds = ranked.map((r) => r._id);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productById = new Map(
      products.map((p) => [String(p._id), p]),
    );

    const data = ranked
      // Drop rankings for products that no longer exist, so we only ever show
      // real, purchasable catalogue items.
      .filter((r) => productById.has(String(r._id)))
      .map((r) => {
        const p = productById.get(String(r._id));
        // Prefer a live colour from the product's variants; fall back to the
        // colour that was actually bought.
        const color =
          p.variants?.[0]?.color || r.lastColor || "";
        return {
          _id: p._id,
          id: p._id,
          title: p.title,
          slug: p.slug,
          price: p.price,
          image: p.images?.[0] || r.snapshotImage || "",
          color,
          rating: p.rating || 0,
          unitsSold: r.units,
          revenue: Number((r.revenue || 0).toFixed(2)),
        };
      });

    return res.status(200).json({
      success: true,
      message: "Fetched top selling products successfully",
      data,
    });
  } catch (err) {
    console.error("getTopSellingProducts error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// SEARCH PRODUCTS (get)
// Free-text search across title, description and slug. Returns a compact
// list (only the fields the search UI needs) to keep the payload small.
export const searchProducts = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.status(200).json({
        success: true,
        message: "No search term provided",
        data: [],
      });
    }

    // Escape regex special chars so user input is treated literally
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const products = await Product.find({
      $or: [{ title: regex }, { description: regex }, { slug: regex }],
    })
      .select("title price images slug variants")
      .limit(20);

    return res.status(200).json({
      success: true,
      message: "Fetched search results successfully",
      data: products,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET SINGLE PRODUCT BY ID (get)
export const getProductById = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }
    const product = await Product.findById(productId).populate(
      "category subcategory",
    );
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Fetched product successfully",
      data: product,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//UPDATE A PRODUCT (patch)
export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const variants = parseVariants(req.body.variants);
    if (variants === null) {
      return res.status(400).json({
        success: false,
        message: "Variants must be a valid JSON array",
      });
    }
    const updates = {
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      subcategory: req.body.subcategory,
      slug: req.body.slug,
      rating: Number(req.body.rating) || 0,
      variants: variants,
      isFeatured: req.body.isFeatured === "true",
    };
    const existingImages = parseStringArray(req.body.existingImages);
    if (existingImages === null) {
      return res.status(400).json({
        success: false,
        message: "existingImages must be a valid JSON array",
      });
    }
    // Upload any new files
    const newImageUrls = [];
    if (req.files && req.files.length > 0) {
      const results = await Promise.all(
        req.files.map((file) =>
          uploadToCloudinary(file.buffer, "ecommerce/products"),
        ),
      );
      results.forEach((result) => newImageUrls.push(result.secure_url));
    }
    // When the client sends existingImages, it is the source of truth for
    // which previously-uploaded images to keep; new uploads are appended.
    // Without it, new uploads replace the set (legacy behavior).
    if (existingImages !== undefined) {
      updates.images = [...existingImages, ...newImageUrls];
    } else if (newImageUrls.length > 0) {
      updates.images = newImageUrls;
    }
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      updates,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Updated product successfully",
      data: updatedProduct,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//DELETE A PRODUCT (delete)
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const deletedProduct = await Product.findOneAndDelete({ _id: productId });
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
        success : true,
        message : "Deleted product successfully",
        data : deletedProduct
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
