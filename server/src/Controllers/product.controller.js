import { Product } from "../Modals/product.modal.js";

// CREATE PRODUCT (post)
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      subcategory,
      slug,
      rating,
      color,
      size,
      stock,
      isFeatured,
    } = req.body;
    const createdProduct = await Product.create({
      title: title,
      description: description,
      price: price,
      category: category,
      subcategory: subcategory,
      slug: slug,
      rating: rating,
      color: color,
      size: size,
      stock: stock,
      isFeatured: isFeatured,
    });
    return res.status(201).json({
      success: true,
      message: "Created produc successfully",
      data: createdProduct,
    });
  } catch (err) {
    console.error(err);
  }
};

// GET ALL PRODUCTS (get)
export const getProduct = async (req, res) => {
  try {
    const allProducts = await Product.find({});
    return res.status(200).json({
      success: true,
      message: "Fetched all products successfully",
      data: allProducts,
    });
  } catch (err) {
    console.error(err);
  }
};

//UPDATE A PRODUCT (patch)
export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    return res.status(204).json({
      success: true,
      message: "Updated product successfully",
      data: updatedProduct,
    });
  } catch (err) {
    console.error(err);
  }
};

//DELETE A PRODUCT (delete)
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const deletedProduct = await Product.findOneAndDelete({ _id: productId });
    return res.status(200).json({
        success : true,
        message : "Deleted product successfully",
        data : deletedProduct
    })
  } catch (err) {
    console.error(err);
  }
};
