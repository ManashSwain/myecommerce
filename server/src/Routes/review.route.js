import express from "express";
import { createReview, deleteReview, getReview, updateReview } from "../Controllers/review.controller.js";

const router = express.Router();

router.post("/createreview",createReview);
router.get("/getreviews",getReview);
router.patch("/updatereview/:reviewId",updateReview);
router.delete("deletereview/:reviewId",deleteReview);

export default router