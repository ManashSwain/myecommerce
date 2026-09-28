import mongoose from "mongoose";
import { Order } from "../Modals/order.modal.js";
import { Cart } from "../Modals/cart.modal.js";
import { Product } from "../Modals/product.modal.js";
import { sendOrderStatusEmail } from "../utils/email.js";

const TAX_RATE = 0.0863;

// Fire-and-forget order email so a mail failure never breaks the API
// response. Logs (rather than throws) on failure.
const notifyOrderStatus = (order) => {
  sendOrderStatusEmail(order).catch((err) =>
    console.error("Order status email failed:", err.message)
  );
};

// Generate a human-friendly order number, e.g. "ORD-482913"
const generateOrderNumber = () =>
  `ORD-${Date.now().toString().slice(-6)}${Math.floor(
    Math.random() * 90 + 10
  )}`;

// Statuses where the order has left the warehouse and can no longer be
// cancelled by the customer.
const NON_CANCELLABLE_STATUSES = ["shipped", "delivered", "cancelled", "refunded"];

// Put the ordered quantities back into product variant stock. Called when an
// order is cancelled (the mirror of the decrement done at order time).
const restockOrderItems = async (order) => {
  await Promise.all(
    (order.items || [])
      .filter((item) => item.product)
      .map((item) =>
        Product.updateOne(
          {
            _id: item.product,
            "variants.color": item.color,
            "variants.size": item.size,
          },
          { $inc: { "variants.$.stock": item.quantity } }
        )
      )
  );
};

// Shared cancellation logic for both customer and admin cancellations.
// `cancelledBy` is "user" or "admin"; `reason` is optional free text.
const applyCancellation = async (order, { cancelledBy, reason }) => {
  order.status = "cancelled";
  // Money was collected at checkout, so a refund is now owed.
  order.paymentStatus = "refund_pending";
  order.cancellation = {
    cancelledBy,
    reason: reason || "",
    cancelledAt: new Date(),
    refundStatus: "pending",
    refundAmount: order.total,
  };
  await order.save();

  // Return the stock so cancelled items become sellable again.
  await restockOrderItems(order);

  notifyOrderStatus(order);
  return order;
};

// CREATE ORDER (post)
// Accepts the checkout payload (contact email, shipping address,
// delivery method) and builds the order from the user's current cart.
// Products are snapshotted into the order, then the cart is emptied.
export const createOrder = async (req, res) => {
  try {
    const {
      userId,
      contactEmail,
      shippingAddress,
      deliveryMethod = "Standard",
      shipping = 0,
    } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid contact email is required" });
    }
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.pincode
    ) {
      return res
        .status(400)
        .json({ success: false, message: "A complete shipping address is required" });
    }

    const cart = await Cart.findOne({ userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty" });
    }

    const items = cart.items
      .filter((item) => item.product)
      .map((item) => ({
        product: item.product._id,
        title: item.product.title,
        price: item.product.price,
        image: item.product.images?.[0] || "",
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        // keep the populated product so we can validate/update stock below
        _product: item.product,
      }));

    if (items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart has no valid products" });
    }

    // Validate stock for every line before doing anything destructive
    for (const item of items) {
      const variant = (item._product.variants || []).find(
        (v) => v.color === item.color && v.size === item.size
      );
      const available = variant ? variant.stock : 0;
      if (available < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `"${item.title}" (${item.color} / ${item.size}) only has ${available} left in stock.`,
        });
      }
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxes = Number((subtotal * TAX_RATE).toFixed(2));
    const shippingCost = Number(shipping) || 0;
    const total = Number((subtotal + shippingCost + taxes).toFixed(2));

    const order = await Order.create({
      userId,
      orderNumber: generateOrderNumber(),
      contactEmail,
      items: items.map(({ _product, ...rest }) => rest),
      shippingAddress,
      deliveryMethod,
      subtotal,
      shipping: shippingCost,
      taxes,
      total,
      status: "placed",
    });

    // Reduce stock for the ordered variants now that the order is placed.
    // Stock lives on each variant (matched by color + size).
    await Promise.all(
      items.map((item) =>
        Product.updateOne(
          { _id: item.product, "variants.color": item.color, "variants.size": item.size },
          { $inc: { "variants.$.stock": -item.quantity } }
        )
      )
    );

    // Clear the cart now that the order is placed
    cart.items = [];
    cart.subtotal = 0;
    await cart.save();

    // Send the confirmation email (non-blocking)
    notifyOrderStatus(order);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// CREATE DIRECT ORDER (post) — "Buy now".
// Accepts explicit line items ({ productId, color, size, quantity }) so a
// single product can be ordered straight from its page. The cart is NOT read
// and NOT modified — this path is fully independent of the shopping bag.
export const createDirectOrder = async (req, res) => {
  try {
    const {
      userId,
      contactEmail,
      shippingAddress,
      deliveryMethod = "Standard",
      shipping = 0,
      items: rawItems,
    } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid contact email is required" });
    }
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.pincode
    ) {
      return res
        .status(400)
        .json({ success: false, message: "A complete shipping address is required" });
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one item is required" });
    }

    // Load the products referenced by the requested items
    const productIds = rawItems.map((item) => item.productId);
    if (productIds.some((id) => !mongoose.isValidObjectId(id))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }
    const products = await Product.find({ _id: { $in: productIds } });
    const productById = new Map(
      products.map((product) => [product._id.toString(), product])
    );

    const items = [];
    for (const item of rawItems) {
      const product = productById.get(String(item.productId));
      const quantity = Number(item.quantity) || 1;
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "A product in your order was not found" });
      }
      if (quantity < 1) {
        return res
          .status(400)
          .json({ success: false, message: "quantity must be at least 1" });
      }
      const variant = (product.variants || []).find(
        (v) => v.color === item.color && v.size === item.size
      );
      const available = variant ? variant.stock : 0;
      if (available < quantity) {
        return res.status(400).json({
          success: false,
          message: `"${product.title}" (${item.color} / ${item.size}) only has ${available} left in stock.`,
        });
      }
      items.push({
        product: product._id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || "",
        quantity,
        color: item.color,
        size: item.size,
      });
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxes = Number((subtotal * TAX_RATE).toFixed(2));
    const shippingCost = Number(shipping) || 0;
    const total = Number((subtotal + shippingCost + taxes).toFixed(2));

    const order = await Order.create({
      userId,
      orderNumber: generateOrderNumber(),
      contactEmail,
      items,
      shippingAddress,
      deliveryMethod,
      subtotal,
      shipping: shippingCost,
      taxes,
      total,
      status: "placed",
    });

    // Reduce stock for the ordered variants now that the order is placed
    await Promise.all(
      items.map((item) =>
        Product.updateOne(
          { _id: item.product, "variants.color": item.color, "variants.size": item.size },
          { $inc: { "variants.$.stock": -item.quantity } }
        )
      )
    );

    // NOTE: the user's cart is intentionally left untouched.

    // Send the confirmation email (non-blocking)
    notifyOrderStatus(order);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    console.error("createDirectOrder error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET ORDERS FOR A USER (get) — newest first
export const getOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Fetched orders successfully",
      data: orders,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET SINGLE ORDER (get)
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Fetched order successfully",
      data: order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET ALL ORDERS (get) — admin. Newest first, optional ?status= filter.
export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Fetched all orders successfully",
      data: orders,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// UPDATE ORDER STATUS (patch) — admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const allowed = ["placed", "processing", "shipped", "delivered"];
    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(", ")}`,
      });
    }
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Let the customer know their order status changed (non-blocking)
    notifyOrderStatus(order);

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// CANCEL MY ORDER (patch) — customer.
// A customer may cancel only while the order is still "placed" or
// "processing". Once it has shipped (or been delivered) cancellation is
// blocked — they must contact support instead.
export const cancelMyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, reason } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Only the order's owner can cancel it.
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own orders",
      });
    }

    if (NON_CANCELLABLE_STATUSES.includes(order.status)) {
      const pretty =
        order.status.charAt(0).toUpperCase() + order.status.slice(1);
      return res.status(400).json({
        success: false,
        message:
          order.status === "shipped" || order.status === "delivered"
            ? `This order has been ${order.status} and can no longer be cancelled. Please contact support for help.`
            : `This order is already ${pretty.toLowerCase()} and cannot be cancelled again.`,
      });
    }

    const cancelled = await applyCancellation(order, {
      cancelledBy: "user",
      reason,
    });

    return res.status(200).json({
      success: true,
      message:
        "Order cancelled. Your refund will be processed shortly.",
      data: cancelled,
    });
  } catch (err) {
    console.error("cancelMyOrder error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// CANCEL ORDER (patch) — admin.
// Admins can cancel an order at any stage before it is delivered, and even
// recall a shipped order. Terminal states (delivered / already cancelled /
// refunded) are rejected.
export const cancelOrderAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (["delivered", "cancelled", "refunded"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `An order that is already ${order.status} cannot be cancelled.`,
      });
    }

    const cancelled = await applyCancellation(order, {
      cancelledBy: "admin",
      reason,
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: cancelled,
    });
  } catch (err) {
    console.error("cancelOrderAdmin error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// REFUND ORDER (patch) — admin.
// Marks a cancelled order's refund as completed. Optionally accepts a
// refund reference (transaction id) and amount; defaults to the order total.
export const refundOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { refundReference, amount } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "cancelled" && order.status !== "refunded") {
      return res.status(400).json({
        success: false,
        message: "Only a cancelled order can be refunded.",
      });
    }

    if (order.cancellation?.refundStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "This order has already been refunded.",
      });
    }

    const refundAmount =
      amount !== undefined && amount !== null && amount !== ""
        ? Number(amount)
        : order.total;

    if (Number.isNaN(refundAmount) || refundAmount < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Refund amount must be a positive number" });
    }

    order.status = "refunded";
    order.paymentStatus = "refunded";
    order.cancellation = {
      ...(order.cancellation?.toObject
        ? order.cancellation.toObject()
        : order.cancellation || {}),
      refundStatus: "completed",
      refundAmount,
      refundedAt: new Date(),
      refundReference: refundReference || "",
    };
    await order.save();

    notifyOrderStatus(order);

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: order,
    });
  } catch (err) {
    console.error("refundOrder error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


