import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name : {
    type : String,
    required : true
  },
  description : {
    type : String,
    required : true
  },
  subdescription : {
    type : String,
    required : true
  },
  
},{timestamps : true})