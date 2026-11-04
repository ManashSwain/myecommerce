import { adminApiFetch } from "./adminApi";

// Order-status email preferences (admin only).
export const getEmailSettings = (token) =>
  adminApiFetch("/api/email-settings", { token });

export const updateEmailSettings = (token, payload) =>
  adminApiFetch("/api/email-settings", {
    token,
    method: "PUT",
    body: payload,
  });
