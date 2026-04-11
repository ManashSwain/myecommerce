import Subcategory from "../Modals/subcategory.modal.js"

// Create subcategory (CREATE)
export const createSubCategory = async(req,res)=>{
   try {
    const {name,description,image} = req.body ;
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
    console.error(err)
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