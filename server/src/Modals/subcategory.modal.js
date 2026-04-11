import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema({
    name : {
      type : String,
      required : true
    },
    description :{
      type: String,
      required : true
    },
    image : [
      {type:String}
    ]
},{timestamps:true})

const Subcategory = mongoose.models.Subcategory || mongoose.model("Subcategory", subcategorySchema)

export default Subcategory;