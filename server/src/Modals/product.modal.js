import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: true,
    },

    size: {
      type: String,
      required: true,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },

    images: [
      {
        type: String,
      },
    ],

    slug: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      default: 0,
    },

    variants: [variantSchema],

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);