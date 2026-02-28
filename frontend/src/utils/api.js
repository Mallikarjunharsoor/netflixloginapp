import { getStoredToken } from "./auth";

// Vite requires 'import.meta.env' for environment variables.
// In Vercel, make sure you add VITE_API_URL to the Environment Variables.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // We combine the BASE_URL (e.g. https://api.vercel.app) with the path (e.g. /api/auth/login)
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export const api = {
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  fetchCatalog: () => request("/api/movies/home"),
};
