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
    },
    // Admin (store) reply to this review. A single, editable public response
    // that is shown to everyone viewing the product's reviews.
    adminReply : {
        type : String,
        default : "",
    },
    adminRepliedAt : {
        type : Date,
    },
    adminRepliedBy : {
        type : String,
    },
},{timestamps : true})

export const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema)