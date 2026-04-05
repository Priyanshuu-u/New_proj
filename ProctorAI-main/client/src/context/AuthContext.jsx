import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("accessToken");
    const saved = localStorage.getItem("user");
    if (!token || !saved) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      return null;
    }
    try {
      const parsed = JSON.parse(saved);
      if (!parsed?.id || !parsed?.role) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        return null;
      }
      return parsed;
    } catch (_error) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      return null;
    }
  });

  function login(payload) {
    if (!payload?.user?.id || !payload?.user?.role) {
      return;
    }
    localStorage.setItem("accessToken", payload.accessToken);
    localStorage.setItem("refreshToken", payload.refreshToken);
    localStorage.setItem("user", JSON.stringify(payload.user));
    setUser(payload.user);
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
