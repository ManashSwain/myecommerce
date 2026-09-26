import mongoose from "mongoose";
import { Review } from "../Modals/review.modal.js"

// CREATE OR UPDATE REVIEW (post)
// One review per user per product: first post creates (rating required),
// later posts update the same review (rating optional — kept if omitted)
export const createReview = async (req,res) => {
  try {
    const {userId,clerkId,userName,productId,rating,content}= req.body
    if (!clerkId || !productId || !content) {
      return res.status(400).json({
        success : false,
        message : "clerkId, productId and content are required",
      })
    }
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success : false,
        message : "Invalid product ID",
      })
    }
    if (rating !== undefined && (Number(rating) < 1 || Number(rating) > 5)) {
      return res.status(400).json({
        success : false,
        message : "Rating must be between 1 and 5",
      })
    }

    const existingReview = await Review.findOne({ clerkId, productId });
    if (existingReview) {
      if (rating !== undefined) existingReview.rating = Number(rating);
      existingReview.content = content;
      if (userName) existingReview.userName = userName;
      await existingReview.save();
      return res.status(200).json({
        success : true,
        message : "Review updated successfully",
        data : existingReview,
      })
    }

    // First review from this user — rating is required
    if (!rating) {
      return res.status(400).json({
        success : false,
        message : "Rating is required for your first review",
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
// UPDATE REVIEW (patch) — only the review's author may update it
export const updateReview = async (req,res) => {
   try {
     const reviewId = req.params.reviewId;
     const { clerkId, rating, content, userName } = req.body;
     const review = await Review.findById(reviewId);
     if (!review) {
       return res.status(404).json({
         success : false,
         message : "Review not found",
       })
     }
     if (review.clerkId !== clerkId) {
       return res.status(403).json({
         success : false,
         message : "You can only update your own reviews",
       })
     }
     if (rating !== undefined) {
       if (Number(rating) < 1 || Number(rating) > 5) {
         return res.status(400).json({
           success : false,
           message : "Rating must be between 1 and 5",
         })
       }
       review.rating = Number(rating);
     }
     if (content) review.content = content;
     if (userName) review.userName = userName;
     const updatedReview = await review.save();
     return res.status(200).json({
        success : true,
        message : "Updated review successfully",
        data : updatedReview
     })
   }catch(err){
    return res.status(500).json({
      success : false,
      message : err.message,
    })
   }
}
// DELETE REVIEW (delete) — only the review's author may delete it
export const deleteReview = async(req,res)=>{
  try {
   const reviewId = req.params.reviewId ;
   const { clerkId } = req.body;
   const review = await Review.findById(reviewId);
   if (!review) {
     return res.status(404).json({
       success : false,
       message : "Review not found",
     })
   }
   if (review.clerkId !== clerkId) {
     return res.status(403).json({
       success : false,
       message : "You can only delete your own reviews",
     })
   }
   const deletedReview = await Review.findOneAndDelete({_id:reviewId})
   return res.status(200).json({
    success : true,
    message : "Deleted successfully",
    data : deletedReview
   })
  }catch(err){
    return res.status(500).json({
      success : false,
      message : err.message,
    })
  }
}