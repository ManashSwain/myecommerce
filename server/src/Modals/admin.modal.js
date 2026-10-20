import mongoose from "mongoose";

// The admin allow-list.
//
// Auth0 owns the credentials (password, MFA, social login); this collection
// answers a different question: "is this Auth0 identity allowed into the admin
// panel?" A person is added here by email by an existing admin, and the first
// time they sign in with Auth0 we link their `sub` to the record.
const adminSchema = new mongoose.Schema(
  {
    // Auth0 `sub` (e.g. "auth0|…"), set on first successful sign-in.
    // Sparse + unique so multiple invited-but-not-yet-signed-in rows are fine.
    auth0Id: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Lower-cased so lookups are case-insensitive.
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    picture: {
      type: String,
      default: "",
    },
    // "owner" can add/remove other owners; "admin" manages everything else.
    role: {
      type: String,
      enum: ["owner", "admin"],
      default: "admin",
    },
    // Revoke access without losing the audit trail.
    isActive: {
      type: Boolean,
      default: true,
    },
    // Email of the admin who added this record, or "system" for the
    // SUPER_ADMIN_EMAILS bootstrap.
    createdBy: {
      type: String,
      default: "system",
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;
