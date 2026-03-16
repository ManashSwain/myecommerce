import express from 'express'
import { createcategory, getAllCategory } from "../Controllers/category.controller.js";

const router = express.Router()

router.post('/createcategory',createcategory)
router.get("/getcategory",getAllCategory)

export default router