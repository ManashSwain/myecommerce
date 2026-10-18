import express from "express";
import {
  handleclerkwebhooks,
  getAllUsers,
  toggleUserBlock,
  trackLogin,
  getMyStatus,
} from "../Controllers/user.controller.js";

const router = express.Router();

router.post("/webhooks",express.raw({ type: "application/json" }),handleclerkwebhooks)

// Storefront — record a login and read the account's block status.
router.post("/track-login", trackLogin);
router.get("/my-status", getMyStatus);

// Admin — list users with search + pagination, and block/unblock accounts.
router.get("/getallusers", getAllUsers);
router.patch("/block/:userId", toggleUserBlock);

export default router