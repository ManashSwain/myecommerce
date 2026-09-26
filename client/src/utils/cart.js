import { API_BASE_URL } from "../constants";

// Shared cart API helpers — every mutation also notifies listeners
// (e.g. the navbar badge) via the "cart-updated" window event.

export const notifyCartUpdated = () =>
  window.dispatchEvent(new Event("cart-updated"));

export const getCart = async (userId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/cart/getcart/${userId}`);
    const json = await res.json();
    if (!res.ok || json.success === false) return null;
    return json.data;
  } catch {
    return null;
  }
};

export const updateCartQuantity = async (userId, item, quantity) => {
  const res = await fetch(`${API_BASE_URL}/api/cart/updatecart/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: item.productId ?? item.product?._id ?? item.product,
      color: item.color,
      size: item.size,
      quantity,
    }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not update quantity");
  }
  notifyCartUpdated();
  return json.data;
};

export const removeCartItem = async (userId, item) => {
  const res = await fetch(`${API_BASE_URL}/api/cart/deletecart/${userId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: item.productId ?? item.product?._id ?? item.product,
      color: item.color,
      size: item.size,
    }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not remove item");
  }
  notifyCartUpdated();
  return json.data;
};
