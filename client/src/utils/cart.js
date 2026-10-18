import { API_BASE_URL } from "../constants";
import { apiFetch } from "./api";

// Shared cart API helpers — every mutation also notifies listeners
// (e.g. the navbar badge) via the "cart-updated" window event.
// All requests go through apiFetch so a blocked account surfaces the
// "account blocked" modal globally.

export const notifyCartUpdated = () =>
  window.dispatchEvent(new Event("cart-updated"));

export const getCart = async (userId) => {
  try {
    const res = await apiFetch(`/api/cart/getcart/${userId}`);
    const json = await res.json();
    if (!res.ok || json.success === false) return null;
    return json.data;
  } catch {
    return null;
  }
};

export const updateCartQuantity = async (userId, item, quantity) => {
  const res = await apiFetch(`/api/cart/updatecart/${userId}`, {
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
  const res = await apiFetch(`/api/cart/deletecart/${userId}`, {
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
