import express from "express";
import { createCart, deleteCart, getCart, updateCart } from "../Controllers/cart.controller.js";

const router = express.Router();

router.post("/createcart", createCart);
router.get("/getcart/:userId", getCart);
router.patch("/updatecart/:userId", updateCart);
router.delete("/deletecart/:userId", deleteCart);

export default router
