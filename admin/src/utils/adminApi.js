import { API_BASE_URL } from "../constants";

// Error type that carries the server's machine-readable `code` so the auth
// gate can tell "not an admin" apart from "the API is down".
export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// Fetch wrapper for admin endpoints. Every call carries the Auth0 ID token;
// the server rejects requests without a valid, allow-listed identity.
export const adminApiFetch = async (
  path,
  { token, method = "GET", body } = {},
) => {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError("Could not reach the server. Is the API running?", {
      code: "NETWORK_ERROR",
    });
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    throw new ApiError(json.message || `Request failed (${res.status})`, {
      status: res.status,
      code: json.code,
    });
  }

  return json;
};
