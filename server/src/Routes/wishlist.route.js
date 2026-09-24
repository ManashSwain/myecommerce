import express from "express";

import {
  createWishlist,
  getWishlist,
  deleteWishlist,
} from "../Controllers/wishlist.controller.js";

const router = express.Router();

// Add item
router.post("/", createWishlist);

// Get user's wishlist
router.get("/:userId", getWishlist);

// Remove item
router.delete("/", deleteWishlist);

export default router;