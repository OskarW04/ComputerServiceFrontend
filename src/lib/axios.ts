import axios from "axios";

// Default to production URL if env var is not set, or localhost if desired
const BASE_URL =
  import.meta.env.VITE_API_URL || "https://computerservice.antek.page";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        // Assuming the auth response structure saves token in the user object or we need to adjust AuthContext to save token separately.
        // Based on AuthResponse in swagger: { token: string, role: string, username: string }
        // The AuthContext saves this whole object as 'user'.
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error("Error parsing user from local storage", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login if 401 occurs
      // We avoid direct window.location change if possible, but for a quick fix it works.
      // Better to dispatch an event that AuthContext listens to.
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
