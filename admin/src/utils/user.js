import { API_BASE_URL } from "../constants";

// Fetch a paginated, searchable list of users (admin).
// params: { search, page, limit, status }  status: "all" | "active" | "blocked"
export const getAllUsers = async ({
  search = "",
  page = 1,
  limit = 10,
  status = "all",
} = {}) => {
  const query = new URLSearchParams({
    search,
    page: String(page),
    limit: String(limit),
    status,
  }).toString();

  const res = await fetch(`${API_BASE_URL}/api/getallusers?${query}`);
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not load users");
  }
  return {
    users: json.data || [],
    pagination: json.pagination || { page: 1, limit, total: 0, totalPages: 1 },
    summary: json.summary || {
      totalUsers: 0,
      activeUsers: 0,
      blockedUsers: 0,
      newUsers: 0,
    },
  };
};

// Block or unblock a user. Pass `isBlocked` explicitly, or omit to toggle.
// `reason` is stored on the account and shown to the customer when blocked.
export const setUserBlocked = async (userId, isBlocked, reason = "") => {
  const res = await fetch(`${API_BASE_URL}/api/block/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(typeof isBlocked === "boolean" ? { isBlocked } : {}),
      ...(reason ? { reason } : {}),
    }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not update user");
  }
  return json.data;
};
