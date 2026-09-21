
import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isSubscribed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Newsletter = mongoose.models.Newsletter ||  mongoose.model("Newsletter", newsletterSchema);

