import express from "express";
import { chat } from "../Controllers/chat.controller.js";

const router = express.Router();

router.post("/", chat);

export default router;
