import { Category } from "../Modals/category.modal.js"

// Create Category 

 export const createcategory = async(req,res)=>{
  const {name,description,image} = req.body ; 
  const category = await Category.create({
     name : name,
     description : description,
     image : image
  })
  res.status(200).json({
    message : "Category created successfully",
    data : category
  })

}