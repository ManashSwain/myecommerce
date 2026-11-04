import mongoose from "mongoose";

// One singleton document holds the admin's email-delivery preferences.
// Status flags are stored separately from `disabledForAll` so pausing every
// email does not erase the individual selections.
const emailSettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    statuses: {
      type: Map,
      of: Boolean,
      default: () => new Map(),
    },
    disabledForAll: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
  },
  { timestamps: true, minimize: false },
);

const EmailSettings =
  mongoose.models.EmailSettings ||
  mongoose.model("EmailSettings", emailSettingsSchema);

export default EmailSettings;
