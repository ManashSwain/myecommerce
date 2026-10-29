import mongoose from "mongoose";

export const TICKET_CATEGORIES = [
  "order",
  "product",
  "payment",
  "delivery",
  "account",
  "other",
];

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"];

export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];

// A public message from the support team. These are shown to the customer in
// their ticket history; `authorEmail` stays in the admin view for audit.
const ticketReplySchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    authorName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "Support team",
    },
    authorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      default: "",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

// Human-friendly reference shown to the customer and in the admin panel.
// The tail of an ObjectId gives us a short, effectively unique value without
// an extra database round-trip.
const generateTicketNumber = () =>
  `TKT-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
      default: generateTicketNumber,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: TICKET_CATEGORIES,
      default: "other",
    },
    priority: {
      type: String,
      enum: TICKET_PRIORITIES,
      default: "normal",
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: "open",
    },
    // Who the ticket belongs to. clerkId is empty for tickets raised by an
    // admin for someone who has not created a storefront account.
    requester: {
      clerkId: {
        type: String,
        default: "",
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 200,
      },
    },
    // Optional reference to an order, kept as free text so a customer can
    // raise a ticket before/without the order being available in the account.
    orderNumber: {
      type: String,
      trim: true,
      maxlength: 64,
      default: "",
    },
    // "customer" = storefront contact form, "admin" = created in the panel.
    source: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    // Admin who created the ticket, when source === "admin".
    createdBy: {
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      name: {
        type: String,
        trim: true,
        maxlength: 120,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 200,
      },
    },
    // Audit fields for status changes made in the admin panel.
    statusUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    statusUpdatedBy: {
      type: String,
      trim: true,
      default: "",
    },
    // Messages from support. The storefront shows these under the ticket so
    // customers can follow the conversation without email.
    adminReplies: {
      type: [ticketReplySchema],
      default: [],
    },
  },
  { timestamps: true },
);

// The admin list is usually filtered by status and sorted newest-first.
ticketSchema.index({ status: 1, createdAt: -1 });
// "My tickets" looks a customer up by their Clerk id.
ticketSchema.index({ "requester.clerkId": 1, createdAt: -1 });

const Ticket =
  mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);

export default Ticket;
