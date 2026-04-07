import express from "express";
import { handleclerkwebhooks } from "../Controllers/user.controller.js";

const router = express.Router();

router.post("/webhooks",express.raw({ type: "application/json" }),handleclerkwebhooks)

export default router