import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import func2url from "../../backend/func2url.json";
import type { PlanId } from "@/lib/plans";

const AUTH_URL = func2url["auth"];
const TOKEN_KEY = "auth_token";

export interface User {
  id: number;
  email: string;
  name: string;
  plan: PlanId;
  createdAt: string | null;
  emailVerified?: boolean;
  isAdmin?: boolean;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  register: (data: { name: string; email: string; password: string; consent: boolean }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  changePlan: (plan: PlanId) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => (typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);

  const loadProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(AUTH_URL, { headers: { "X-Auth-Token": token } });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      /* оффлайн — оставляем как есть */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const register = async (payload: { name: string; email: string; password: string; consent: boolean }) => {
    const res = await fetch(`${AUTH_URL}?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось зарегистрироваться");
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  };

  const login = async (payload: { email: string; password: string }) => {
    const res = await fetch(`${AUTH_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось войти");
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const changePlan = async (plan: PlanId) => {
    const token = getToken();
    if (!token) throw new Error("Требуется авторизация");
    const res = await fetch(AUTH_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось сменить тариф");
    setUser(data.user);
  };

  const deleteAccount = async () => {
    const token = getToken();
    if (!token) throw new Error("Требуется авторизация");
    const res = await fetch(AUTH_URL, {
      method: "DELETE",
      headers: { "X-Auth-Token": token },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось удалить аккаунт");
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch(`${AUTH_URL}?action=forgot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось отправить письмо");
  };

  const resetPassword = async (token: string, password: string) => {
    const res = await fetch(`${AUTH_URL}?action=reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось сменить пароль");
  };

  const verifyEmail = async (verifyToken: string) => {
    const res = await fetch(`${AUTH_URL}?action=verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: verifyToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось подтвердить email");
    if (user && data.user && user.id === data.user.id) setUser(data.user);
    else if (getToken()) loadProfile();
  };

  const resendVerification = async () => {
    const token = getToken();
    if (!token) throw new Error("Требуется авторизация");
    const res = await fetch(`${AUTH_URL}?action=resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось отправить письмо");
    if (data.alreadyVerified) loadProfile();
  };

  const updateProfile = async (payload: Record<string, string>) => {
    const token = getToken();
    if (!token) throw new Error("Требуется авторизация");
    const res = await fetch(AUTH_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось сохранить");
    setUser(data.user);
  };

  const updateName = (name: string) => updateProfile({ name });
  const changePassword = (currentPassword: string, newPassword: string) =>
    updateProfile({ currentPassword, newPassword });

  return (
    <Ctx.Provider
      value={{
        user, loading, register, login, logout, changePlan, forgotPassword, resetPassword, deleteAccount,
        verifyEmail, resendVerification, updateName, changePassword,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}