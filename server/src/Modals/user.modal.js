import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    clerkId : {
        type: String,
        required : true,
        unique : true
    },
    first_name : {
        type : String,
        required : true
    },
    last_name : {
        type: String,
        required : true
    },
    profile_image_url : {
        type : String
    },
    username : {
        type : String,
        unique : true
    },
    email_addresses : {
        type: String,
        unique: true,
        required : true
    },
    // Admin-controlled suspension. A blocked user's account is disabled in the
    // storefront; the admin Users panel can toggle this on and off.
    isBlocked: {
        type: Boolean,
        default: false,
    }
},{timestamps:true})

const User = mongoose.models.User || mongoose.model("User", userSchema)

export default User