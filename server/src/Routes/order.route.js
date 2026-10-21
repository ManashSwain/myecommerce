import express from "express";
import {
  approveReturn,
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
  receiveReturnedItems,
  receiveReturn,
  refundOrder,
  rejectReturn,
  requestReplacement,
  requestReturn,
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

// Returns after delivery (partial or full). Customer raises a request; an
// admin approves/rejects it, receives the parcel, then processes the refund.
router.patch("/return/request/:orderId", requireActiveAccount, requestReturn);
router.patch("/admin/return/approve/:orderId", approveReturn);
router.patch("/admin/return/reject/:orderId", rejectReturn);
router.patch("/admin/return/receive/:orderId", receiveReturnedItems);

export default router;

