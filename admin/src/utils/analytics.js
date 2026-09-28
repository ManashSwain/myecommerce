import { API_BASE_URL } from "../constants";

// Fetch aggregated dashboard analytics (sales, inventory, ratings, best sellers).
export const getDashboardAnalytics = async (days = 14) => {
  const res = await fetch(`${API_BASE_URL}/api/analytics/dashboard?days=${days}`);
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Could not load analytics");
  }
  return json.data;
};
