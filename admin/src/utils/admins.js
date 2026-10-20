import { adminApiFetch } from "./adminApi";

// Session check: returns the current admin record or throws NOT_AN_ADMIN.
export const getMyAdmin = (token) => adminApiFetch("/api/admins/me", { token });

export const getAdmins = (token) => adminApiFetch("/api/admins", { token });

export const createAdmin = (token, payload) =>
  adminApiFetch("/api/admins", { token, method: "POST", body: payload });

export const updateAdmin = (token, adminId, payload) =>
  adminApiFetch(`/api/admins/${adminId}`, {
    token,
    method: "PATCH",
    body: payload,
  });

export const deleteAdmin = (token, adminId) =>
  adminApiFetch(`/api/admins/${adminId}`, { token, method: "DELETE" });
