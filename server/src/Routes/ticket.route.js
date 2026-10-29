import express from "express";
import { requireAdmin } from "../middlewares/adminAuth.js";
import { requireClerkUser } from "../middlewares/clerkAuth.js";
import {
  createAdminTicket,
  createTicket,
  getMyTickets,
  listTickets,
  updateTicket,
} from "../Controllers/ticket.controller.js";

const router = express.Router();

// Storefront customers (Clerk session required).
router.post(
  "/",
  requireClerkUser("Please sign in to raise a support ticket."),
  createTicket,
);
router.get(
  "/mine",
  requireClerkUser("Please sign in to view your support tickets."),
  getMyTickets,
);

// Admin panel (Auth0 + allow-list required).
router.get("/", requireAdmin, listTickets);
router.post("/admin", requireAdmin, createAdminTicket);
router.patch("/admin/:ticketId", requireAdmin, updateTicket);

export default router;
