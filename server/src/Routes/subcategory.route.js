import express from "express"
import { createSubCategory, deleteSubCategory, getAllsubcategories, updatesubcategory } from "../Controllers/subcategory.controller.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

router.post("/createsubcategory", upload.single('image'), createSubCategory);
router.get("/getsubcategory",getAllsubcategories);
router.patch("/updatesubcategory/:subcategoryid", upload.single('image'), updatesubcategory);
router.delete("/deletesubcategory/:subcategoryid",deleteSubCategory);

export default router ;
