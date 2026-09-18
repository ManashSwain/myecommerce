import { Cart } from "../Modals/cart.modal.js";
import { Product } from "../Modals/product.modal.js";

// Recalculate subtotal from the items' current product prices
const calculateSubtotal = async (items) => {
  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const priceById = new Map(
    products.map((product) => [product._id.toString(), product.price]),
  );
  return items.reduce(
    (total, item) =>
      total + (priceById.get(item.product.toString()) || 0) * item.quantity,
    0,
  );
};

// Matches a cart line by product + variant (same product in a different
// color/size is a separate line item)
const findItem = (cart, productId, color, size) =>
  cart.items.find(
    (item) =>
      item.product.toString() === productId &&
      item.color === color &&
      item.size === size,
  );

// ADD ITEM TO CART (post)
// Creates the cart on first use; increments quantity if the same
// product + color + size is already in the cart
export const createCart = async (req, res) => {
  try {
    const { userId, productId, quantity = 1, color, size } = req.body;
    if (!userId || !productId || !color || !size) {
      return res.status(400).json({
        success: false,
        message: "userId, productId, color and size are required",
      });
    }
    if (Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: "quantity must be at least 1",
      });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({ userId });
    const isNewCart = !cart;
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = findItem(cart, productId, color, size);
    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({
        product: productId,
        quantity: Number(quantity),
        color,
        size,
      });
    }

    cart.subtotal = await calculateSubtotal(cart.items);
    await cart.save();
    await cart.populate("items.product");

    return res.status(isNewCart ? 201 : 200).json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET CART BY USER (get)
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId }).populate("items.product");
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Fetched cart successfully",
      data: cart,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// UPDATE ITEM QUANTITY (patch)
// Sets the quantity of one line item (identified by product + color + size)
export const updateCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, color, size, quantity } = req.body;
    if (!productId || !color || !size || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "productId, color, size and quantity are required",
      });
    }
    if (Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: "quantity must be at least 1 — use deletecart to remove an item",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = findItem(cart, productId, color, size);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    item.quantity = Number(quantity);
    cart.subtotal = await calculateSubtotal(cart.items);
    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: cart,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// REMOVE ITEM FROM CART (delete)
// Removes one line item (identified by product + color + size in the body)
export const deleteCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, color, size } = req.body;
    if (!productId || !color || !size) {
      return res.status(400).json({
        success: false,
        message: "productId, color and size are required",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemCount = cart.items.length;
    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          item.color === color &&
          item.size === size
        ),
    );
    if (cart.items.length === itemCount) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    cart.subtotal = await calculateSubtotal(cart.items);
    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: cart,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
