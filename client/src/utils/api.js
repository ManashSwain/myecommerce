import { toast } from "react-toastify";
import { API_BASE_URL } from "../constants";

// ---------------------------------------------------------------------------
// Global blocked-account handling.
//
// Every storefront request that can be refused for a blocked account goes
// through `apiFetch`. When the server answers 403 with `code: ACCOUNT_BLOCKED`
// we broadcast an event that the AccountStatusProvider listens for, which opens
// the "Your account is blocked" modal. Callers still get the parsed JSON back
// (and a thrown error) so their local logic can bail out cleanly.
// ---------------------------------------------------------------------------

export const ACCOUNT_BLOCKED_EVENT = "account-blocked";

const broadcastBlocked = (reason) => {
  window.dispatchEvent(
    new CustomEvent(ACCOUNT_BLOCKED_EVENT, { detail: { reason } }),
  );
};

/**
 * Drop-in replacement for `fetch` against the app's API.
 *
 * @param {string} path   e.g. "/api/cart/createcart" or a full URL
 * @param {RequestInit} options  standard fetch options
 * @returns {Promise<Response>} the raw Response (so existing `.json()` calls work)
 * @throws {Error} on network failure or a blocked-account response
 */
export const apiFetch = async (path, options = {}) => {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new Error("Network error — please check your connection.");
  }

  // Clone so we can inspect the body without consuming it for the caller.
  let json = null;
  try {
    json = await res.clone().json();
  } catch {
    // Non-JSON response (e.g. empty body) — nothing special to detect.
  }

  if (res.status === 403 && json?.code === "ACCOUNT_BLOCKED") {
    broadcastBlocked(json.message || "");
    const err = new Error(
      json.message ||
        "Your account has been blocked. Please contact support.",
    );
    err.code = "ACCOUNT_BLOCKED";
    throw err;
  }

  return res;
};

// Convenience: returns parsed JSON and throws on !ok / success:false,
// while still surfacing the blocked event via apiFetch.
export const apiJson = async (path, options = {}) => {
  const res = await apiFetch(path, options);
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok || (json && json.success === false)) {
    throw new Error(json?.message || "Request failed");
  }
  return json;
};

// Lightweight status check used on sign-in.
export const fetchMyStatus = async (userId) => {
  const res = await apiFetch(
    `/api/my-status?userId=${encodeURIComponent(userId)}`,
  );
  const json = await res.json();
  if (!res.ok || json.success === false) {
    return { isBlocked: false };
  }
  return json.data || { isBlocked: false };
};

// Record a login (fire-and-forget). Returns the status payload.
export const trackLogin = async (userId) => {
  const res = await apiFetch(`/api/track-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    return { isBlocked: false };
  }
  return json.data || { isBlocked: false };
};

export { toast };
