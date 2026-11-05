import express from "express";
import { requireClerkUser } from "../middlewares/clerkAuth.js";
import { chat, updateChatFeedback } from "../Controllers/chat.controller.js";

const router = express.Router();

// The assistant costs money to run, so require a real Clerk session rather
// than trusting a userId supplied by the browser.
router.post(
  "/",
  requireClerkUser("Please sign in to use the AI assistant."),
  chat,
);

// Like/dislike on a stored reply. Also requires a real Clerk session; the
// controller additionally checks that the document belongs to that user.
router.patch(
  "/:chatId/feedback",
  requireClerkUser("Please sign in to rate assistant responses."),
  updateChatFeedback,
);

export default router;
