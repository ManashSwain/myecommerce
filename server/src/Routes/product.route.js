import express from "express"
import { createProduct, deleteProduct, getProduct, updateProduct } from "../Controllers/product.controller.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

router.post("/createproduct", upload.array('images'), createProduct);
router.get("/getallproducts",getProduct);
router.patch("/updateproduct/:productId", upload.array('images'), updateProduct);
router.delete("/deleteproduct/:productId",deleteProduct)

export default router