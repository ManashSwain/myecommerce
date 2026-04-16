import { Review } from "../Modals/review.modal.js"

// CREATE REVIEW (create)
export const createReview = async (req,res) => {
  try {
    const {userId,clerkId,productId,rating,content}= req.body
    const createdReview = await Review.create({
      userId:userId,
      clerkId:clerkId,
      productId:productId,
      rating:rating,
      content:content,
      date: Date.now()
    })
    return res.status(201).json({
        success : true,
        message : "Review created successfully",
        data : createReview
    })
  }catch(err){
    console.error(err)
  }
}
// GET REVIEWS (get)
export const getReview = async (req,res)=>{
  try {
    const allReviews = await Review.find({});
    return res.status(200).json({
        success : true,
        message : "Fetched all reviews successfully",
        data : allReviews
    })
  }catch(err){
   console.error(err)
  }
}
// UPDATE REVIEW (patch)
export const updateReview = async (req,res) => {
   try {
     const reviewId = req.params.revewId;
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