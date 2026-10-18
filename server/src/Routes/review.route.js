import express from "express";
import { adminReplyReview, createReview, deleteReview, getReview, updateReview } from "../Controllers/review.controller.js";
import { requireActiveAccount } from "../middlewares/accountStatus.js";

const router = express.Router();

// Reads are public; writes require an active (non-blocked) account.
router.post("/createreview", requireActiveAccount, createReview);
router.get("/getreviews", getReview);
router.patch("/updatereview/:reviewId", requireActiveAccount, updateReview);
// Admin replies to a review (shown publicly on the product page)
router.patch("/admin/reply/:reviewId", adminReplyReview);
router.delete("/deletereview/:reviewId", deleteReview);

export default router