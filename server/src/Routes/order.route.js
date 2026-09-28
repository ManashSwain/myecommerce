import express from "express";
import {
  cancelMyOrder,
  cancelOrderAdmin,
  createOrder,
  createDirectOrder,
  getAllOrders,
  getOrderById,
  getOrders,
  refundOrder,
  updateOrderStatus,
} from "../Controllers/order.controller.js";

const router = express.Router();

router.post("/createorder", createOrder);
// "Buy now" — orders explicit items without touching the cart
router.post("/createdirectorder", createDirectOrder);
router.get("/getorders/:userId", getOrders);
router.get("/getorder/:orderId", getOrderById);
// Customer cancels their own order (only while placed/processing)
router.patch("/cancel/:orderId", cancelMyOrder);
// Admin
router.get("/getallorders", getAllOrders);
router.patch("/updatestatus/:orderId", updateOrderStatus);
// Admin cancels any cancellable order; then processes the refund
router.patch("/admin/cancel/:orderId", cancelOrderAdmin);
router.patch("/admin/refund/:orderId", refundOrder);

export default router;

