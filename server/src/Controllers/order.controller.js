import mongoose from "mongoose";
import { Order } from "../Modals/order.modal.js";
import { Cart } from "../Modals/cart.modal.js";

const TAX_RATE = 0.0863;

// Generate a human-friendly order number, e.g. "ORD-482913"
const generateOrderNumber = () =>
  `ORD-${Date.now().toString().slice(-6)}${Math.floor(
    Math.random() * 90 + 10
  )}`;

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
      }));

    if (items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart has no valid products" });
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

    // Clear the cart now that the order is placed
    cart.items = [];
    cart.subtotal = 0;
    await cart.save();

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


