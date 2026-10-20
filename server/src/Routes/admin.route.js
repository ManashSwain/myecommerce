import express from "express";
import { requireAdmin } from "../middlewares/adminAuth.js";
import {
  getMyAdmin,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../Controllers/admin.controller.js";

const router = express.Router();

// Every route below is gated: valid Auth0 token + active allow-list record.
router.use(requireAdmin);

router.get("/me", getMyAdmin);
router.get("/", listAdmins);
router.post("/", createAdmin);
router.patch("/:adminId", updateAdmin);
router.delete("/:adminId", deleteAdmin);

export default router;
