import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    clerkId : {
        type : String,
        required : true
    },
    userName : {
        type : String,
        default : "Anonymous"
    },
    productId : {
       type : mongoose.Schema.Types.ObjectId,
       ref : "Product"
    },
    rating : {
        type : Number,
        required : true
    },
    content : {
        type : String,
        required : true
    },
    date : {
        type : Date,
    }
},{timestamps : true})

export const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema)