import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "User",
        required : true
    },
    clerkId : {
        type : String,
        required : true
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