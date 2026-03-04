import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/api/entities";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("aura_token");
    if (token) {
      authService
        .me()
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem("aura_token");
          localStorage.removeItem("aura_email");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    localStorage.setItem("aura_token", data.token);
    localStorage.setItem("aura_email", data.email);
    setUser({ email: data.email });
    return data;
  };

  const signup = async (email, password) => {
    const data = await authService.signup({ email, password });
    localStorage.setItem("aura_token", data.token);
    localStorage.setItem("aura_email", data.email);
    setUser({ email: data.email });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("aura_token");
    localStorage.removeItem("aura_email");
    setUser(null);
  };

  const getToken = () => localStorage.getItem("aura_token");

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