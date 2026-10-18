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
    },
    // ---- Block / unblock audit trail (who, when, why) -------------------
    blockedAt: {
        type: Date,
    },
    // Free-text admin note explaining the block (shown to the customer).
    blockReason: {
        type: String,
    },
    // "admin" for now; kept as a string so automated/manual actors can differ.
    blockedBy: {
        type: String,
    },
    // Bumped on every block. The storefront sends it with authenticated
    // requests; a mismatch means the user's session is stale → force re-auth.
    // This is how an active session is invalidated the moment an account is
    // blocked (a real-world "kill existing sessions" pattern).
    sessionVersion: {
        type: Number,
        default: 0,
    },
    // Stamped when the customer loads the storefront signed in. Used to tell
    // "has ever logged in" apart from merely "registered".
    lastLoginAt: {
        type: Date,
    },
    hasLoggedIn: {
        type: Boolean,
        default: false,
    }
},{timestamps:true})

const User = mongoose.models.User || mongoose.model("User", userSchema)

export default User