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

export const updateOrderStatus = async (orderId, status, options = {}) => {
  const res = await fetch(
    `${API_BASE_URL}/api/order/updatestatus/${orderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...options }),
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

// Admin dispatches a replacement: a new unit is shipped and one is taken out
// of stock. No money involved.
export const dispatchReplacementAdmin = async (orderId, note = "") => {
  const res = await fetch(
    `${API_BASE_URL}/api/order/admin/replacement/dispatch/${orderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    }
  );
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not dispatch the replacement");
  }
  return json.data;
};

// Admin completes a replacement: the original item is received back and
// (optionally) restocked. No money involved.
export const completeReplacementAdmin = async (
  orderId,
  { note = "", resellable = true } = {}
) => {
  const res = await fetch(
    `${API_BASE_URL}/api/order/admin/replacement/complete/${orderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note, resellable }),
    }
  );
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not complete the replacement");
  }
  return json.data;
};

// Admin approves a customer return request, allowing the customer to send the
// items back.
export const approveReturnAdmin = async (orderId) => {
  const res = await fetch(
    `${API_BASE_URL}/api/order/admin/return/approve/${orderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    }
  );
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not approve the return");
  }
  return json.data;
};

// Admin rejects a return request; the order goes back to delivered.
export const rejectReturnAdmin = async (orderId, reason) => {
  const res = await fetch(
    `${API_BASE_URL}/api/order/admin/return/reject/${orderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }
  );
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not reject the return");
  }
  return json.data;
};

// Admin receives the returned parcel. `restock` false is for items that
// can't be resold (damaged, worn, etc.).
export const receiveReturnedItemsAdmin = async (orderId, restock = true) => {
  const res = await fetch(
    `${API_BASE_URL}/api/order/admin/return/receive/${orderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restock }),
    }
  );
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not receive the return");
  }
  return json.data;
};

// Admin records that cash was collected for a Cash on Delivery order.
export const markOrderPaidAdmin = async (orderId, reference = "") => {
  const res = await fetch(
    `${API_BASE_URL}/api/order/admin/markpaid/${orderId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    }
  );
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not mark the order as paid");
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
