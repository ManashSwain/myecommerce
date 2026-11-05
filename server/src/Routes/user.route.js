import express from "express";
import { requireAdmin } from "../middlewares/adminAuth.js";
import {
  getAllUsers,
  toggleUserBlock,
  trackLogin,
  getMyStatus,
  syncUsersFromClerk,
} from "../Controllers/user.controller.js";

const router = express.Router();

// NOTE: the Clerk webhook is mounted directly in index.js, before
// express.json(), because signature verification needs the raw body.

// Storefront — record a login and read the account's block status.
router.post("/track-login", trackLogin);
router.get("/my-status", getMyStatus);

// Admin — list users with search + pagination, and block/unblock accounts.
router.get("/getallusers", getAllUsers);
router.patch("/block/:userId", toggleUserBlock);

// Admin — backfill/repair the collection from Clerk (webhook-independent).
router.post("/sync-users", requireAdmin, syncUsersFromClerk);

export default router