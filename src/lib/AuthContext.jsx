import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/api/entities";
import { requestNotificationPermission, subscribeToPushNotifications } from "./pushNotifications";
import { toast } from "sonner";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("aurasync_token");
    if (token) {
      authService
        .me()
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem("aurasync_token");
          localStorage.removeItem("aurasync_email");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Independent Web Push registration
      const setupPush = async () => {
        try {
          const granted = await requestNotificationPermission();
          if (granted) {
            const subscription = await subscribeToPushNotifications();
            if (subscription) {
              await authService.registerPushSubscription(subscription);
            }
          }
        } catch (err) {
          console.error("Push registration error:", err);
        }
      };
      
      setupPush();
    }
  }, [user]);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    localStorage.setItem("aurasync_token", data.token);
    localStorage.setItem("aurasync_email", data.email);
    setUser({
      email: data.email,
      id: data.id,
      username: data.username,
      role: data.role,
    });
    return data;
  };

  const signup = async (email, password, username, displayName = null) => {
    const data = await authService.signup({
      email,
      password,
      display_name: displayName || username,
      username,
    });
    localStorage.setItem("aurasync_token", data.token);
    localStorage.setItem("aurasync_email", data.email);
    setUser({
      email: data.email,
      id: data.id,
      username: data.username,
      role: data.role,
    });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("aurasync_token");
    localStorage.removeItem("aurasync_email");
    setUser(null);
  };

  const getToken = () => localStorage.getItem("aurasync_token");

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}