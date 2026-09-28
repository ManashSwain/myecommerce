import { API_BASE_URL } from "../constants";

// Fetch every order (admin). Optional status filter: "all" | "placed" | ...
export const getAllOrders = async (status = "all") => {
  const query = status && status !== "all" ? `?status=${status}` : "";
  const res = await fetch(`${API_BASE_URL}/api/order/getallorders${query}`);
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not load orders");
  }
  return json.data || [];
};

export const updateOrderStatus = async (orderId, status) => {
  const res = await fetch(
    `${API_BASE_URL}/api/order/updatestatus/${orderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not update order status");
  }
  return json.data;
};

// Admin cancels any order that hasn't reached a terminal state.
export const cancelOrderAdmin = async (orderId, reason) => {
  const res = await fetch(`${API_BASE_URL}/api/order/admin/cancel/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not cancel the order");
  }
  return json.data;
};

// Admin confirms a returned item has physically reached the store. This is
// what restocks a shipped-then-cancelled order and makes it refundable.
export const receiveReturnAdmin = async (orderId) => {
  const res = await fetch(
    `${API_BASE_URL}/api/order/admin/receivereturn/${orderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    }
  );
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not receive the return");
  }
  return json.data;
};

// Admin processes the refund for a cancelled order. Optional transaction
// reference is stored on the order.
export const refundOrderAdmin = async (orderId, refundReference = "") => {
  const res = await fetch(`${API_BASE_URL}/api/order/admin/refund/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refundReference }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not process the refund");
  }
  return json.data;
};
