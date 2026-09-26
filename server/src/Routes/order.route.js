import express from "express";
import {
  createOrder,
  createDirectOrder,
  getAllOrders,
  getOrderById,
  getOrders,
  updateOrderStatus,
} from "../Controllers/order.controller.js";

const router = express.Router();

router.post("/createorder", createOrder);
// "Buy now" — orders explicit items without touching the cart
router.post("/createdirectorder", createDirectOrder);
router.get("/getorders/:userId", getOrders);
router.get("/getorder/:orderId", getOrderById);
// Admin
router.get("/getallorders", getAllOrders);
router.patch("/updatestatus/:orderId", updateOrderStatus);

export default router;

