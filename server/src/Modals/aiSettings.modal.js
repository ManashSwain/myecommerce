import mongoose from "mongoose";

// One singleton document holds the storefront-wide AI assistant switch.
// A missing document means "enabled" so deploying this feature does not
// silently turn the assistant off for every customer.
const aiSettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
  },
  { timestamps: true },
);

const AiSettings =
  mongoose.models.AiSettings ||
  mongoose.model("AiSettings", aiSettingsSchema);

export default AiSettings;
