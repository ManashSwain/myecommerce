import express from 'express'
import { createcategory, deleteCategory, getAllCategory, updateCategory } from "../Controllers/category.controller.js";
import { upload } from "../utils/multer.js";

const router = express.Router()

router.post('/createcategory', upload.single('image'), createcategory)
router.get("/getcategory",getAllCategory)
router.patch("/updatecategory/:categoryId", upload.single('image'), updateCategory)
router.delete("/deletecategory/:categoryId",deleteCategory)

export default router