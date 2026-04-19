import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    clerkId : {
        type : String,
        required : true
    },
    fullName : {
        type : String,
        required : true
    },
    phone : {
        type : String,
        required : true
    },
    addressLine1 : {
        type : String,
        required : true
    },
    addressLine2 : {
        type : String
    },
    country : {
        type : String,
        required : true
    },
    state : {
        type : String,
        required : true
    },
    district : {
        type : String,
        required : true
    },
    city : {
        type : String ,
        required : true
    },
    pincode : {
        type : String,
        required : true
    },
    landmark : {
        type: String,
        required : true
    },
    addressType : {
        type : String,
        enum : ["home", "work", "other"],
        default : "home"
    }
},{timestamps : true})

export const Address = mongoose.models.Address || mongoose.model("Address", addressSchema)