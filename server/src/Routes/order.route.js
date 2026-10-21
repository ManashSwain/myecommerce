import express from "express";
import {
  cancelMyOrder,
  cancelOrderAdmin,
  completeReplacement,
  confirmCheckout,
  createCheckoutSession,
  createOrder,
  createDirectOrder,
  dispatchReplacement,
  getAllOrders,
  getOrderById,
  getOrders,
  markOrderPaid,
  receiveReturn,
  refundOrder,
  requestReplacement,
  updateOrderStatus,
} from "../Controllers/order.controller.js";
import { requireActiveAccount } from "../middlewares/accountStatus.js";

const router = express.Router();

// Stripe Checkout
router.post("/create-checkout-session", requireActiveAccount, createCheckoutSession);
router.post("/confirm-checkout", requireActiveAccount, confirmCheckout);

router.post("/createorder", requireActiveAccount, createOrder);
// "Buy now" — orders explicit items without touching the cart
router.post("/createdirectorder", requireActiveAccount, createDirectOrder);
router.get("/getorders/:userId", requireActiveAccount, getOrders);
router.get("/getorder/:orderId", getOrderById);
// Customer cancels their own order (only while placed/processing)
router.patch("/cancel/:orderId", requireActiveAccount, cancelMyOrder);
// Admin
router.get("/getallorders", getAllOrders);
router.patch("/updatestatus/:orderId", updateOrderStatus);
// Admin cancels any cancellable order; then processes the refund
router.patch("/admin/cancel/:orderId", cancelOrderAdmin);
// Admin confirms a returned item has reached the store (restocks it)
router.patch("/admin/receivereturn/:orderId", receiveReturn);
router.patch("/admin/refund/:orderId", refundOrder);
// Admin records cash collected for a Cash on Delivery order
router.patch("/admin/markpaid/:orderId", markOrderPaid);

// Replacement / exchange (no money). Customer raises; admin dispatches + completes.
router.patch("/replacement/request/:orderId", requestReplacement);
router.patch("/admin/replacement/dispatch/:orderId", dispatchReplacement);
router.patch("/admin/replacement/complete/:orderId", completeReplacement);

export default router;

