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
        unique : true,
        required : true
    }
},{timestamps:true})

const User = mongoose.models.User || mongoose.model("User", userSchema)

export default User