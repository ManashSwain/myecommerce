import mongoose from "mongoose";
import { Product } from "../Modals/product.modal.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

// String arrays (e.g. existingImages) arrive as JSON strings too
const parseStringArray = (raw) => {
  if (raw === undefined) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : null;
  } catch {
    return null;
  }
};

// Variants arrive as a JSON string in multipart form data
const parseVariants = (raw) => {
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  return parsed.map((variant) => ({
    color: variant.color,
    size: variant.size,
    stock: Number(variant.stock),
  }));
};

// CREATE PRODUCT (post)
export const createProduct = async (req, res) => {
  try {
    const images = [];
    if (req.files && req.files.length > 0) {
      const results = await Promise.all(
        req.files.map((file) =>
          uploadToCloudinary(file.buffer, "ecommerce/products"),
        ),
      );
      results.forEach((result) => images.push(result.secure_url));
    }
    const variants = parseVariants(req.body.variants);
    if (variants === null) {
      return res.status(400).json({
        success: false,
        message: "Variants must be a valid JSON array",
      });
    }
    const createdProduct = await Product.create({
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      subcategory: req.body.subcategory,
      images: images,
      slug: req.body.slug,
      rating: Number(req.body.rating) || 0,
      variants: variants,
      isFeatured: req.body.isFeatured === "true",
    });
    return res.status(201).json({
      success: true,
      message: "Created produc successfully",
      data: createdProduct,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET ALL PRODUCTS (get)
export const getProduct = async (req, res) => {
  try {
    const allProducts = await Product.find({}).populate(
      "category subcategory",
    );
    return res.status(200).json({
      success: true,
      message: "Fetched all products successfully",
      data: allProducts,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET SINGLE PRODUCT BY ID (get)
export const getProductById = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }
    const product = await Product.findById(productId).populate(
      "category subcategory",
    );
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Fetched product successfully",
      data: product,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//UPDATE A PRODUCT (patch)
export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const variants = parseVariants(req.body.variants);
    if (variants === null) {
      return res.status(400).json({
        success: false,
        message: "Variants must be a valid JSON array",
      });
    }
    const updates = {
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      subcategory: req.body.subcategory,
      slug: req.body.slug,
      rating: Number(req.body.rating) || 0,
      variants: variants,
      isFeatured: req.body.isFeatured === "true",
    };
    const existingImages = parseStringArray(req.body.existingImages);
    if (existingImages === null) {
      return res.status(400).json({
        success: false,
        message: "existingImages must be a valid JSON array",
      });
    }
    // Upload any new files
    const newImageUrls = [];
    if (req.files && req.files.length > 0) {
      const results = await Promise.all(
        req.files.map((file) =>
          uploadToCloudinary(file.buffer, "ecommerce/products"),
        ),
      );
      results.forEach((result) => newImageUrls.push(result.secure_url));
    }
    // When the client sends existingImages, it is the source of truth for
    // which previously-uploaded images to keep; new uploads are appended.
    // Without it, new uploads replace the set (legacy behavior).
    if (existingImages !== undefined) {
      updates.images = [...existingImages, ...newImageUrls];
    } else if (newImageUrls.length > 0) {
      updates.images = newImageUrls;
    }
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      updates,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Updated product successfully",
      data: updatedProduct,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//DELETE A PRODUCT (delete)
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const deletedProduct = await Product.findOneAndDelete({ _id: productId });
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
        success : true,
        message : "Deleted product successfully",
        data : deletedProduct
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
