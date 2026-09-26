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
