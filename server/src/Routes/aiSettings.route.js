import express from "express";
import { requireAdmin } from "../middlewares/adminAuth.js";
import {
  getAiAssistantStatus,
  getAiSettings,
  updateAiSettings,
} from "../Controllers/aiSettings.controller.js";

const router = express.Router();

// Public: the storefront only needs to know whether the launcher should be
// shown. Mounted before the admin gate below.
router.get("/status", getAiAssistantStatus);

// Admin panel only: Auth0 token + active allow-list record.
router.use(requireAdmin);

router.get("/", getAiSettings);
router.put("/", updateAiSettings);

export default router;
