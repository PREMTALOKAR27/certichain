import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import type { User, UserRole } from "../types";

interface AuthContextValue {
  user: User | null;
  signIn(
    email: string,
    password: string,
    expectedRole?: UserRole,
  ): Promise<User>;
  register(name: string, email: string, password: string): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function storedUser(): User | null {
  try {
    return JSON.parse(
      localStorage.getItem("certichain_user") || "null",
    ) as User | null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(storedUser);

  async function signIn(
    email: string,
    password: string,
    expectedRole?: UserRole,
  ) {
    const result = await api<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (expectedRole && result.user.role !== expectedRole) {
      throw new Error(
        expectedRole === "ADMIN"
          ? "This is a student account. Use the Student portal to sign in."
          : "This is an institution account. Use the Institution portal to sign in.",
      );
    }
    localStorage.setItem("certichain_token", result.token);
    localStorage.setItem("certichain_user", JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }

  async function register(name: string, email: string, password: string) {
    await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }

  function signOut() {
    localStorage.removeItem("certichain_token");
    localStorage.removeItem("certichain_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, signIn, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
