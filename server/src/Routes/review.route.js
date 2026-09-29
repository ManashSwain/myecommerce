import express from "express";
import { adminReplyReview, createReview, deleteReview, getReview, updateReview } from "../Controllers/review.controller.js";

const router = express.Router();

router.post("/createreview",createReview);
router.get("/getreviews",getReview);
router.patch("/updatereview/:reviewId",updateReview);
// Admin replies to a review (shown publicly on the product page)
router.patch("/admin/reply/:reviewId",adminReplyReview);
router.delete("/deletereview/:reviewId",deleteReview);

export default router