import express from "express";
import { requireClerkUser } from "../middlewares/clerkAuth.js";
import { chat } from "../Controllers/chat.controller.js";

const router = express.Router();

// The assistant costs money to run, so require a real Clerk session rather
// than trusting a userId supplied by the browser.
router.post(
  "/",
  requireClerkUser("Please sign in to use the AI assistant."),
  chat,
);

export default router;
