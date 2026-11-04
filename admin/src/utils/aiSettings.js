import { adminApiFetch } from "./adminApi";

export const getAiSettings = (token) =>
  adminApiFetch("/api/ai-settings", { token });

export const updateAiSettings = (token, payload) =>
  adminApiFetch("/api/ai-settings", {
    token,
    method: "PUT",
    body: payload,
  });
