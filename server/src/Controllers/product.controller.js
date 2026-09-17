import { Product } from "../Modals/product.modal.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

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
    const createdProduct = await Product.create({
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      subcategory: req.body.subcategory,
      images: images,
      slug: req.body.slug,
      rating: Number(req.body.rating) || 0,
      color: req.body.color,
      size: req.body.size,
      stock: Number(req.body.stock),
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

//UPDATE A PRODUCT (patch)
export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const updates = {
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      subcategory: req.body.subcategory,
      slug: req.body.slug,
      rating: Number(req.body.rating) || 0,
      color: req.body.color,
      size: req.body.size,
      stock: Number(req.body.stock),
      isFeatured: req.body.isFeatured === "true",
    };
    // Only replace images when new files are uploaded
    if (req.files && req.files.length > 0) {
      const results = await Promise.all(
        req.files.map((file) =>
          uploadToCloudinary(file.buffer, "ecommerce/products"),
        ),
      );
      updates.images = results.map((result) => result.secure_url);
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
