import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aurasync_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401/403 and handle global errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const errorMsg = err.response?.data?.error || "";
    
    // Only logout on 401 (Unauthorized) or 403 if it's a global ban/suspension
    const isAuthError = status === 401;
    const isBanError = status === 403 && (
      errorMsg.toLowerCase().includes("banned") || 
      errorMsg.toLowerCase().includes("suspended") ||
      errorMsg.toLowerCase().includes("session expired") ||
      errorMsg.toLowerCase().includes("access denied")
    );

    if (isAuthError || isBanError) {
      toast.error(errorMsg || "Session expired or access denied");
      
      localStorage.removeItem("aurasync_token");
      localStorage.removeItem("aurasync_email");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    } else if (status === 403) {
      // For other 403s (like feature disabled), just show the error without logging out
      toast.error(errorMsg || "Access denied");
    } else if (status === 500) {
      toast.error("A server error occurred. Please try again later.");
    } else if (err.code === "ECONNABORTED" || !err.response) {
      toast.error("Network error. Please check your connection.");
    }
    return Promise.reject(err);
  }
);

export default api;
