import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema({
    name : {
      type : String,
      required : true,
      unique : true
    },
    description :{
      type: String,
      required : true
    },
    image : [
      {type:String}
    ]
},{timestamps:true})

export const Subcategory = mongoose.models.Subcategory || mongoose.model("Subcategory", subcategorySchema)

