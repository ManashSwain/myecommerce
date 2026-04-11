import express from "express"
import { createSubCategory, getAllsubcategories, updatesubcategory } from "../Controllers/subcategory.controller.js";

const router = express.Router();

router.post("/createsubcategory", createSubCategory);
router.get("/getsubcategory",getAllsubcategories);
router.patch("/updatesubcategory/:subcategoryid",updatesubcategory);
// router.delete();

export default router ;