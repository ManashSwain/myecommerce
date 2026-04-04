import express from 'express'
import { createcategory, getAllCategory, updateCategory } from "../Controllers/category.controller.js";

const router = express.Router()

router.post('/createcategory',createcategory)
router.get("/getcategory",getAllCategory)
router.patch("/updatecategory/:categoryId",updateCategory )

export default router