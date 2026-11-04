// Base URL of the backend API. Required — set VITE_API_BASE_URL in .env
// (see .env.example) or in the hosting provider's build environment.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Add it to your .env file (see .env.example)."
  );
}

// Strip trailing slashes so `${API_BASE_URL}/api/...` stays clean.
export const API_BASE_URL = apiBaseUrl.replace(/\/+$/, "");
