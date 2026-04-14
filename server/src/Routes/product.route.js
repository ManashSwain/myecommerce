import express from "express"
import { createProduct, deleteProduct, getProduct, updateProduct } from "../Controllers/product.controller.js";

const router = express.Router();

router.post("/createproduct",createProduct);
router.get("/getallproducts",getProduct);
router.patch("/updateproduct/:productId",updateProduct);
router.delete("/deleteproduct/:productId",deleteProduct)

export default router