import {Subcategory} from "../Modals/subcategory.modal.js"
import { uploadToCloudinary } from "../utils/cloudinary.js";

// Create subcategory (CREATE)
export const createSubCategory = async(req,res)=>{
   try {
    const {name,description} = req.body ;
      const image = [];
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, "ecommerce/subcategories");
        image.push(result.secure_url);
      }
      const createdSubcategory = await Subcategory.create({
        name :name,
        description:description,
        image:image
      })
      return res.status(201).json({
         success : true,
         message : "Created subcategory successfully",
         data : createdSubcategory
      })
   }
   catch(err){
    return res.status(500).json({
      success : false,
      message : "error creating a subcategory"
    })
   }
}

// Get all subcategories (GET)
export const getAllsubcategories = async(req,res)=>{
   try {
     const allsubcategories =  await Subcategory.find({});
       return res.status(200).json({
         success : true,
         message : "Fetched all subcategories successfully",
         data : allsubcategories
       })
   }
   catch(err){
      console.error(err)
   }
}

// Update a subcategory (PATCH)
export const updatesubcategory = async (req,res)=>{
  try{
     const subcategoryId= req.params.subcategoryid;
     const updates = { name: req.body.name, description: req.body.description };
     if (req.file) {
       const result = await uploadToCloudinary(req.file.buffer, "ecommerce/subcategories");
       updates.image = [result.secure_url];
     }
     const updatedcategory = await Subcategory.findOneAndUpdate({_id:subcategoryId},updates,{new:true,runValidators:true});
     if (!updatedcategory) {
       return res.status(404).json({
        success : false,
        message : "Subcategory not found"
       })
     }
     return res.status(200).json({
      success : true,
      message : "Updated subcategory successfully",
      data : updatedcategory
     })
  }catch(err){
   console.error(err)
  }
}

// Delete a subcategory (DELETE)
export const deleteSubCategory = async(req,res)=>{
  try {
     const subcategoryId = req.params.subcategoryid ;
     const deletedsubcategory = await Subcategory.findOneAndDelete({_id:subcategoryId});
     return res.status(200).json({
       success : true ,
       message : "Deleted subcategory successfully",
       data : deletedsubcategory
     })
  }catch(err){
   console.error(err)
  }
}