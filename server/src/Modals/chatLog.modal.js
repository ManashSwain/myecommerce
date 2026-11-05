import mongoose from "mongoose";

// Empty means the customer has not rated the reply. The client can also send an
// empty value to clear a previous rating.
export const CHAT_FEEDBACK_VALUES = ["", "like", "dislike"];

// One document per assistant turn. The user fields are a snapshot taken at the
// time of the question, so history stays readable even if the account is later
// renamed or deleted in Clerk.
const chatLogSchema = new mongoose.Schema(
  {
    user: {
      clerkId: {
        type: String,
        required: true,
        index: true,
      },
      name: {
        type: String,
        trim: true,
        maxlength: 120,
        default: "",
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 200,
        default: "",
      },
      imageUrl: {
        type: String,
        default: "",
      },
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    response: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000,
    },
    feedback: {
      type: String,
      enum: CHAT_FEEDBACK_VALUES,
      default: "",
    },
    // Stamped when a rating is saved and cleared when the rating is removed.
    feedbackAt: {
      type: Date,
      default: null,
    },
    // Provider/model that produced the reply (e.g. "gemini:gemini-3.8-flash").
    provider: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

// Feedback analytics and the "recent conversations" view both sort by newest
// first; the per-user index supports a future "my chat history" endpoint.
chatLogSchema.index({ createdAt: -1 });
chatLogSchema.index({ feedback: 1, createdAt: -1 });
chatLogSchema.index({ "user.clerkId": 1, createdAt: -1 });

const ChatLog =
  mongoose.models.ChatLog || mongoose.model("ChatLog", chatLogSchema);

export default ChatLog;
