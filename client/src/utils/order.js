import { API_BASE_URL } from "../constants";

// Place an order from the checkout payload. The backend builds the order
// from the user's cart and clears it on success.
export const createOrder = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/api/order/createorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not place your order");
  }
  // The cart was cleared server-side — let listeners (navbar badge) know.
  window.dispatchEvent(new Event("cart-updated"));
  return json.data;
};

export const getOrders = async (userId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/order/getorders/${userId}`);
    const json = await res.json();
    if (!res.ok || json.success === false) return [];
    return json.data || [];
  } catch {
    return [];
  }
};
