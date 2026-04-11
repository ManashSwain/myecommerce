import express from "express"
import { createSubCategory, getAllsubcategories } from "../Controllers/subcategory.controller.js";

const router = express.Router();

router.post("/createsubcategory", createSubCategory);
router.get("/getsubcategory",getAllsubcategories);
// router.patch();
// router.delete();

export default router ;