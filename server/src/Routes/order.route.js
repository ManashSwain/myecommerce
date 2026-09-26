import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrders,
  updateOrderStatus,
} from "../Controllers/order.controller.js";

const router = express.Router();

router.post("/createorder", createOrder);
router.get("/getorders/:userId", getOrders);
router.get("/getorder/:orderId", getOrderById);
// Admin
router.get("/getallorders", getAllOrders);
router.patch("/updatestatus/:orderId", updateOrderStatus);

export default router;
