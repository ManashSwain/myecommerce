import mongoose from "mongoose";
import { Review } from "../Modals/review.modal.js"

// CREATE REVIEW (create)
export const createReview = async (req,res) => {
  try {
    const {userId,clerkId,userName,productId,rating,content}= req.body
    if (!clerkId || !productId || !rating || !content) {
      return res.status(400).json({
        success : false,
        message : "clerkId, productId, rating and content are required",
      })
    }
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success : false,
        message : "Invalid product ID",
      })
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        success : false,
        message : "Rating must be between 1 and 5",
      })
    }
    const createdReview = await Review.create({
      userId:userId,
      clerkId:clerkId,
      userName:userName,
      productId:productId,
      rating:Number(rating),
      content:content,
      date: Date.now()
    })
    return res.status(201).json({
        success : true,
        message : "Review created successfully",
        data : createdReview
    })
  }catch(err){
    return res.status(500).json({
      success : false,
      message : err.message,
    })
  }
}
// GET REVIEWS (get) — optionally filtered by ?productId=, newest first
export const getReview = async (req,res)=>{
  try {
    const { productId } = req.query;
    const filter = {};
    if (productId) {
      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
          success : false,
          message : "Invalid product ID",
        })
      }
      filter.productId = productId;
    }
    const allReviews = await Review.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
        success : true,
        message : "Fetched all reviews successfully",
        data : allReviews
    })
  }catch(err){
   return res.status(500).json({
     success : false,
     message : err.message,
   })
  }
}
// UPDATE REVIEW (patch)
export const updateReview = async (req,res) => {
   try {
     const reviewId = req.params.reviewId;
     const updatedReview = await Review.findOneAndUpdate({_id : reviewId}, req.body , {
        new : true,
        runValidators : true
     })
     return res.status(200).json({
        success : true,
        message : "Updated review successfully",
        data : updatedReview
     })
   }catch(err){
    console.errror(err)
   }
}
// DELETE REVIEW (delete)
export const deleteReview = async(req,res)=>{
  try {
   const reviewId = req.params.reviewId ;
   const deletedReview = await Review.findOneAndDelete({_id:reviewId})
   return res.status(200).json({
    success : true,
    message : "Deleted successfully",
    data : deletedReview
   })
  }catch(err){
    console.error(err)
  }
}