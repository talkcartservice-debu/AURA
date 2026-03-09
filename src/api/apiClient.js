import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aura_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401/403 and handle global errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      const errorMsg = err.response?.data?.error || "Session expired or access denied";
      toast.error(errorMsg);
      
      localStorage.removeItem("aura_token");
      localStorage.removeItem("aura_email");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    } else if (err.response?.status === 500) {
      toast.error("A server error occurred. Please try again later.");
    } else if (err.code === "ECONNABORTED" || !err.response) {
      toast.error("Network error. Please check your connection.");
    }
    return Promise.reject(err);
  }
);

export default api;
