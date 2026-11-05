import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    clerkId : {
        type: String,
        required : true,
        unique : true
    },
    // Clerk does not require a name (social / phone sign-ups often have none),
    // so these must stay optional or the webhook insert is rejected.
    first_name : {
        type : String,
        default : ""
    },
    last_name : {
        type : String,
        default : ""
    },
    profile_image_url : {
        type : String
    },
    // Optional in Clerk. `sparse` keeps the unique index from treating every
    // user without a username as a duplicate of the others.
    username : {
        type : String,
        unique : true,
        sparse : true
    },
    // Optional too (a Clerk user can be phone-only). Sparse for the same
    // reason as username. Kept unique so one email maps to one account.
    email_addresses : {
        type: String,
        unique: true,
        sparse : true
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

// Existing databases created `username_1` and `email_addresses_1` as
// non-sparse unique indexes. Now that both fields are optional, the indexes
// must be sparse or a second user without one of them looks like a duplicate.
// Mongo never changes an index in place, so drop the legacy one before
// rebuilding it from the current schema. Safe to run on every boot: once the
// index is sparse this is a no-op.
export const ensureUserIndexes = async () => {
    try {
        const collection = mongoose.connection.collection("users");
        const existing = await collection.indexes().catch(() => []);

        for (const name of ["username_1", "email_addresses_1"]) {
            const index = existing.find((entry) => entry.name === name);
            if (index && !index.sparse) {
                await collection.dropIndex(name);
                console.log(`Dropped legacy non-sparse index ${name}`);
            }
        }

        await User.createIndexes();
    } catch (err) {
        // Index maintenance must never stop the API from serving traffic.
        console.error("Could not ensure user indexes:", err.message);
    }
};

export default User