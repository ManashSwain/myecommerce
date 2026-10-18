import express from "express";

import {
  createWishlist,
  getWishlist,
  deleteWishlist,
} from "../Controllers/wishlist.controller.js";
import { requireActiveAccount } from "../middlewares/accountStatus.js";

const router = express.Router();

// Add item
router.post("/", requireActiveAccount, createWishlist);

// Get user's wishlist
router.get("/:userId", requireActiveAccount, getWishlist);

// Remove item
router.delete("/:userId", requireActiveAccount, deleteWishlist);

export default router;
