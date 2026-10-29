import { adminApiFetch } from "./adminApi";

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
};

export const getTickets = (token, params) =>
  adminApiFetch(`/api/tickets${buildQuery(params)}`, { token });

export const createTicket = (token, payload) =>
  adminApiFetch("/api/tickets/admin", {
    token,
    method: "POST",
    body: payload,
  });

export const updateTicket = (token, ticketId, payload) =>
  adminApiFetch(`/api/tickets/admin/${ticketId}`, {
    token,
    method: "PATCH",
    body: payload,
  });
