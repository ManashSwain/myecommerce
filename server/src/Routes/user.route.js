import express from "express";
import {
  handleclerkwebhooks,
  getAllUsers,
  toggleUserBlock,
} from "../Controllers/user.controller.js";

const router = express.Router();

router.post("/webhooks",express.raw({ type: "application/json" }),handleclerkwebhooks)

// Admin — list users with search + pagination, and block/unblock accounts.
router.get("/getallusers", getAllUsers);
router.patch("/block/:userId", toggleUserBlock);

export default router