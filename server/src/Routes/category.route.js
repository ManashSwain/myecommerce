import express from 'express'
import { createcategory } from "../Controllers/category.controller.js";

const router = express.Router()

router.post('/',createcategory)

export default router