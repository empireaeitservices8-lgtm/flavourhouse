"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  BACKEND_URL,
  getCustomerToken,
  setCustomerToken,
  removeCustomerToken,
  getCustomerAuthHeaders,
} from "@/lib/api";

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string | null;
  createdAt?: string;
  totalOrders?: number;
  totalAddresses?: number;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
  updateProfileState: (updated: Partial<Customer>) => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/auth/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.customer) {
          setCustomer(data.customer);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn("Could not fetch customer profile:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getCustomerToken();
      if (storedToken) {
        setToken(storedToken);
        const valid = await fetchProfile(storedToken);
        if (!valid) {
          // Token expired or invalid
          removeCustomerToken();
          setToken(null);
          setCustomer(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchProfile]);

  const login = async (emailOrPhone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        setCustomerToken(data.token);
        setToken(data.token);
        setCustomer(data.customer);
        return { success: true };
      }

      return {
        success: false,
        error: data.error || "Login failed. Please check your credentials.",
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to reach server. Please check your connection.",
      };
    }
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        setCustomerToken(data.token);
        setToken(data.token);
        setCustomer(data.customer);
        return { success: true };
      }

      return {
        success: false,
        error: data.error || "Registration failed. Please check your details.",
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to reach server. Please check your connection.",
      };
    }
  };

  const logout = () => {
    removeCustomerToken();
    setToken(null);
    setCustomer(null);
  };

  const refreshCustomer = async () => {
    const currentToken = token || getCustomerToken();
    if (currentToken) {
      await fetchProfile(currentToken);
    }
  };

  const updateProfileState = (updated: Partial<Customer>) => {
    setCustomer((prev) => (prev ? { ...prev, ...updated } : null));
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        token,
        isLoading,
        isLoggedIn: Boolean(customer && token),
        login,
        register,
        logout,
        refreshCustomer,
        updateProfileState,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}

