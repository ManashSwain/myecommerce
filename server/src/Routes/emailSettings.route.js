import express from "express";
import { requireAdmin } from "../middlewares/adminAuth.js";
import {
  getEmailSettings,
  updateEmailSettings,
} from "../Controllers/emailSettings.controller.js";

const router = express.Router();

// Admin panel only: Auth0 token + active allow-list record.
router.use(requireAdmin);

router.get("/", getEmailSettings);
router.put("/", updateEmailSettings);

export default router;
