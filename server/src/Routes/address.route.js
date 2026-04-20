import express from "express";
import { addAddress, deleteAddress, getAddress, updateAddress } from "../Controllers/address.controller.js";

const router = express.Router()

router.post("/addaddress", addAddress);
router.get("/getalladdress", getAddress );
router.patch("/updateaddress/:addressId" , updateAddress);
router.delete("/deleteaddress/:addressId", deleteAddress);

export default router