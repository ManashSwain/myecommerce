import express from "express";
import { getDashboardAnalytics } from "../Controllers/analytics.controller.js";

const router = express.Router();

// Admin dashboard analytics — all real, aggregated from Order/Product/Review.
router.get("/dashboard", getDashboardAnalytics);

export default router;
