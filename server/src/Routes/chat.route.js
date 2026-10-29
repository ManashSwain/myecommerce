import express from "express";
import { getAuth } from "@clerk/express";
import { chat } from "../Controllers/chat.controller.js";

const router = express.Router();

// The assistant costs money to run, so require a real Clerk session rather
// than trusting a userId supplied by the browser.
const requireSignedIn = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      code: "SIGN_IN_REQUIRED",
      message: "Please sign in to use the AI assistant.",
    });
  }
  next();
};

router.post("/", requireSignedIn, chat);

export default router;
