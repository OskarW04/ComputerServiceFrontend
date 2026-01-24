/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import type { Client, Employee } from "@/data/schema";
import { api } from "@/data/api";

type User = Employee | Client;

interface AuthContextType {
  user: User | null;
  isEmployee: boolean;
  isClient: boolean;
  loginEmployee: (email: string, password?: string) => Promise<void>;
  loginClient: (phone: string, pin: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const loginEmployee = async (email: string, password?: string) => {
    const employee = await api.auth.loginEmployee(email, password);
    setUser(employee as Employee);
  };

  const loginClient = async (phone: string, pin: string) => {
    const client = await api.auth.loginClient(phone, pin);
    setUser(client as Client);
  };

  const logout = () => {
    setUser(null);
  };

  // Helper to safely check role even if type narrowing is tricky with union
  const userRole = user && "role" in user ? (user.role as string) : null;

  const isEmployee =
    !!user &&
    userRole !== null &&
    ["OFFICE", "TECHNICIAN", "WAREHOUSE", "MANAGER"].includes(userRole);
  const isClient = !!user && (!userRole || userRole === "CLIENT");

  return (
    <AuthContext.Provider
      value={{
        user,
        loginEmployee,
        loginClient,
        logout,
        isAuthenticated: !!user,
        isEmployee,
        isClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
