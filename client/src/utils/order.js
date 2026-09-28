import { API_BASE_URL } from "../constants";

// Parse a fetch response defensively. If the server returns a non-JSON body
// (e.g. an HTML 404 because the route isn't registered on a stale server),
// surface a clear Error instead of letting `res.json()` throw a cryptic
// "Unexpected token '<'" and losing the real status code.
const readJson = async (res, fallbackMessage) => {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    // Non-JSON (HTML error page, empty body, etc.)
    throw new Error(
      res.status === 404
        ? `${fallbackMessage} (the server may need to be restarted)`
        : fallbackMessage
    );
  }
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(fallbackMessage);
  }
  if (!res.ok || json.success === false) {
    throw new Error(json.message || fallbackMessage);
  }
  return json;
};

// Place an order from the checkout payload. The backend builds the order
// from the user's cart and clears it on success.
export const createOrder = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/api/order/createorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await readJson(res, "Could not place your order");
  // The cart was cleared server-side — let listeners (navbar badge) know.
  window.dispatchEvent(new Event("cart-updated"));
  return json.data;
};

// "Buy now" — place an order for explicit items without touching the cart.
// Unlike createOrder, the cart is left completely unaffected.
export const createDirectOrder = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/api/order/createdirectorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await readJson(res, "Could not place your order");
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

// Cancel the signed-in user's own order. Only succeeds while the order is
// still "placed" or "processing" — the backend rejects shipped/delivered.
export const cancelOrder = async (orderId, userId, reason) => {
  const res = await fetch(`${API_BASE_URL}/api/order/cancel/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, reason }),
  });
  const json = await readJson(res, "Could not cancel the order");
  return json.data;
};

// Request a replacement (exchange, no money) for a delivered order. The
// customer gets a new unit; the original is picked up and returned.
export const requestReplacement = async (orderId, userId, reason) => {
  const res = await fetch(
    `${API_BASE_URL}/api/order/replacement/request/${orderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reason }),
    }
  );
  const json = await readJson(res, "Could not request a replacement");
  return json.data;
};
