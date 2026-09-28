import mongoose from "mongoose";

// A single purchased line item. Product details are snapshotted at
// purchase time so the order stays accurate even if the product is
// later edited or deleted.
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    color: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Snapshot of the shipping address used for this order.
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    country: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    addressType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item",
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    deliveryMethod: {
      type: String,
      required: true,
      default: "Standard",
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
    },
    taxes: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    // Order lifecycle:
    //   placed → processing → shipped → delivered
    // Cancellation:
    //   placed/processing cancelled  → cancelled         (stock back now)
    //   shipped cancelled            → return_in_transit (stock back only when
    //                                   the item physically reaches the store)
    // Refund finishes an order: cancelled/return_in_transit → refunded
    // Replacement (exchange, no money) — only for delivered orders:
    //   delivered → replacement_requested → replacement_out → replacement_completed
    status: {
      type: String,
      enum: [
        "placed",
        "processing",
        "shipped",
        "delivered",
        "return_in_transit",
        "cancelled",
        "refunded",
        "replacement_requested",
        "replacement_out",
        "replacement_completed",
      ],
      default: "placed",
    },

    // Payment / refund tracking. Orders are paid at checkout in this project,
    // so they start as "paid"; cancelling flips them to refund_pending and an
    // admin refund flips them to refunded.
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refund_pending", "refunded"],
      default: "paid",
    },

    // Populated when an order is cancelled (by the customer or an admin) and
    // updated again once the item is received back and the refund is processed.
    cancellation: {
      cancelledBy: {
        type: String,
        enum: ["user", "admin"],
      },
      reason: {
        type: String,
      },
      cancelledAt: {
        type: Date,
      },
      // Whether the goods were already out for delivery when cancelled. When
      // true, the order sits in "return_in_transit" until an admin confirms
      // the item is back at the store.
      wasShipped: {
        type: Boolean,
        default: false,
      },
      // Set when an admin marks the returned item as received. Only at this
      // point is stock put back on the shelf.
      returnedAt: {
        type: Date,
      },
      // True once the ordered quantities have been added back to inventory.
      stockRestored: {
        type: Boolean,
        default: false,
      },
      // Refund lifecycle for a cancelled order.
      refundStatus: {
        type: String,
        enum: ["not_required", "pending", "completed"],
        default: "not_required",
      },
      refundAmount: {
        type: Number,
        default: 0,
      },
      refundedAt: {
        type: Date,
      },
      refundReference: {
        type: String,
      },
    },

    // Replacement / exchange flow. NO money is involved — a brand-new unit is
    // sent out for the returned/defective one. Kept separate from
    // `cancellation` so the two flows never interfere.
    //   requested → approved/dispatched → received (faulty) → completed
    replacement: {
      // Who kicked it off. Customers raise requests; admins can too.
      requestedBy: {
        type: String,
        enum: ["user", "admin"],
      },
      reason: {
        type: String,
      },
      requestedAt: {
        type: Date,
      },
      // Admin action: the replacement unit has been dispatched.
      approvedAt: {
        type: Date,
      },
      // True once a fresh unit has been taken out of inventory for the
      // replacement (to keep stock honest).
      replacementStockDeducted: {
        type: Boolean,
        default: false,
      },
      // Set when the faulty / original unit arrives back at the store. The
      // unit is restocked at this point (if sellable).
      returnedAt: {
        type: Date,
      },
      stockRestored: {
        type: Boolean,
        default: false,
      },
      completedAt: {
        type: Date,
      },
      // Admin note (e.g. courier details / condition on arrival).
      note: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

export const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
