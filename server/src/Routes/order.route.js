import express from "express";
import {
  createOrder,
  getOrderById,
  getOrders,
} from "../Controllers/order.controller.js";

const router = express.Router();

router.post("/createorder", createOrder);
router.get("/getorders/:userId", getOrders);
router.get("/getorder/:orderId", getOrderById);

export default router;
