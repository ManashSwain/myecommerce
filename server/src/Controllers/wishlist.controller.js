import mongoose from "mongoose";
import { Wishlist } from "../Modals/wishlist.modal.js";
import { Product } from "../Modals/product.modal.js";

// Find wishlist item by product + color + size
const findItem = (wishlist, productId, color, size) =>
wishlist.items.find(
(item) =>
item.product.toString() === productId &&
item.color === color &&
item.size === size
);

// ADD ITEM TO WISHLIST (post)
export const createWishlist = async (req, res) => {
try {
const { userId, productId, color, size } = req.body;

if (!userId || !productId || !color || !size) {
  return res.status(400).json({
    success: false,
    message: "userId, productId, color and size are required",
  });
}

if (!mongoose.isValidObjectId(productId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid product ID",
  });
}

// Check if product exists
const product = await Product.findById(productId);

if (!product) {
  return res.status(404).json({
    success: false,
    message: "Product not found",
  });
}

// Find existing wishlist
let wishlist = await Wishlist.findOne({ userId });

const isNewWishlist = !wishlist;

// Create wishlist if it doesn't exist
if (!wishlist) {
  wishlist = new Wishlist({
    userId,
    items: [],
  });
}

// Check if same product + color + size already exists
const existingItem = findItem(wishlist, productId, color, size);

if (existingItem) {
  return res.status(409).json({
    success: false,
    message: "Item already exists in wishlist",
  });
}

// Add item
wishlist.items.push({
  product: productId,
  color,
  size,
});

await wishlist.save();

// Populate product details
await wishlist.populate("items.product");

return res.status(isNewWishlist ? 201 : 200).json({
  success: true,
  message: "Item added to wishlist",
  data: wishlist,
});

} catch (err) {
return res.status(500).json({
success: false,
message: err.message,
});
}
};

// GET WISHLIST BY USER (get)
export const getWishlist = async (req, res) => {
try {
const { userId } = req.params;

const wishlist = await Wishlist.findOne({ userId }).populate(
  "items.product"
);

if (!wishlist) {
  return res.status(404).json({
    success: false,
    message: "Wishlist not found",
  });
}

return res.status(200).json({
  success: true,
  message: "Fetched wishlist successfully",
  data: wishlist,
});

} catch (err) {
return res.status(500).json({
success: false,
message: err.message,
});
}
};

// REMOVE ITEM FROM WISHLIST (delete)
export const deleteWishlist = async (req, res) => {
try {
const { userId } = req.params;
const { productId, color, size } = req.body;

if (!productId || !color || !size) {
  return res.status(400).json({
    success: false,
    message: "productId, color and size are required",
  });
}

if (!mongoose.isValidObjectId(productId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid product ID",
  });
}

const wishlist = await Wishlist.findOne({ userId });

if (!wishlist) {
  return res.status(404).json({
    success: false,
    message: "Wishlist not found",
  });
}

const itemCount = wishlist.items.length;

wishlist.items = wishlist.items.filter(
  (item) =>
    !(
      item.product.toString() === productId &&
      item.color === color &&
      item.size === size
    )
);

// Item wasn't found
if (wishlist.items.length === itemCount) {
  return res.status(404).json({
    success: false,
    message: "Item not found in wishlist",
  });
}

await wishlist.save();

// Populate product details
await wishlist.populate("items.product");

return res.status(200).json({
  success: true,
  message: "Item removed from wishlist",
  data: wishlist,
});

} catch (err) {
return res.status(500).json({
success: false,
message: err.message,
});
}
}
