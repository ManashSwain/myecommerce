import express from "express";
import { createCart, deleteCart, getCart, updateCart } from "../Controllers/cart.controller.js";
import { requireActiveAccount } from "../middlewares/accountStatus.js";

const router = express.Router();

// Blocked accounts can't touch their cart.
router.post("/createcart", requireActiveAccount, createCart);
router.get("/getcart/:userId", requireActiveAccount, getCart);
router.patch("/updatecart/:userId", requireActiveAccount, updateCart);
router.delete("/deletecart/:userId", requireActiveAccount, deleteCart);

export default router
