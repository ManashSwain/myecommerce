import { Category } from "../Modals/category.modal.js";

// Create Category  (Create)
export const createcategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const category = await Category.create({
      name: name,
      description: description,
      image: image,
    });
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Fetch all category  (Read)
export const getAllCategory = async (req, res) => {
  try {
    const allCategories = await Category.find({});
    res.status(200).json({
      success: true,
      message: "Fetched all categories successfully",
      data: allCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update category (Update)

export const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const updatecategory = await Category.findOneAndUpdate(
      { _id: categoryId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!updateCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    res.status(200).json({
      sucess: true,
      message: "Updated successfully",
      data: updatecategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete category (delete)

export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const deletedCategory = await Category.findOneAndDelete({
      _id: categoryId,
    });
    if (!deleteCategory) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }
    return res.status(200).json({
      success : true ,
      message : "Deleted successfully",
      deletedCategory : deletedCategory
    })
  } catch (error) {
    console.error(error);
  }
};
