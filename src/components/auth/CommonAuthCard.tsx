"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldAlert,
} from "lucide-react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import {
  BACKEND_URL,
  getAdminToken,
  setAdminToken,
  fetchFromBackend,
} from "@/lib/api";

interface CommonAuthCardProps {
  mode?: "customer" | "admin";
  initialTab?: "login" | "register";
  returnUrlOverride?: string;
}

export function CommonAuthCard({
  mode = "customer",
  initialTab = "login",
  returnUrlOverride,
}: CommonAuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = returnUrlOverride || searchParams.get("returnUrl") || (mode === "admin" ? "/admin/dashboard" : "/account/orders");

  const { isLoggedIn: isCustomerLoggedIn, login: customerLogin, register: customerRegister } = useCustomerAuth();

  const [activeTab, setActiveTab] = useState<"login" | "register">(mode === "admin" ? "login" : initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [customerBlockedFromAdmin, setCustomerBlockedFromAdmin] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register fields (only for customer mode)
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Check if session is already active
  useEffect(() => {
    if (mode === "admin") {
      const adminToken = getAdminToken();
      if (adminToken) {
        // Quick verification of admin token
        fetchFromBackend("/api/admin/auth/me").then((res) => {
          if (res.ok && res.data?.admin) {
            router.replace("/admin/dashboard");
          }
        }).catch(() => {});
      }
    } else {
      if (isCustomerLoggedIn) {
        router.push(returnUrl);
      }
    }
  }, [mode, isCustomerLoggedIn, returnUrl, router]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setCustomerBlockedFromAdmin(false);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "admin") {
        // Strict Admin Authentication Flow
        const res = await fetch(`${BACKEND_URL}/api/admin/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanIdentifier, password }),
        });

        const data = await res.json();

        if (res.ok && data.success && data.token) {
          setAdminToken(data.token);
          setSuccessMessage("Admin authentication successful! Redirecting to Dashboard...");
          setTimeout(() => {
            router.replace("/admin/dashboard");
          }, 600);
        } else if (res.status === 403 || data.isCustomer) {
          // A customer attempted to log into the admin portal
          setCustomerBlockedFromAdmin(true);
          setErrorMessage(
            data.error || "Access denied. Customer accounts cannot access the Administration Portal. Please sign in via the customer portal."
          );
        } else {
          setErrorMessage(data.error || "Invalid administrator credentials. Please check your email and password.");
        }
      } else {
        // Customer / Unified Authentication Flow
        // Check unified endpoint first to handle admins signing in on common login
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrPhone: cleanIdentifier, password, requestedRole: "customer" }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          if (data.role === "admin" && data.token) {
            // Admin signed in on common login page -> redirect to Admin Dashboard
            setAdminToken(data.token);
            setSuccessMessage("Admin credentials recognized! Redirecting to Admin Dashboard...");
            setTimeout(() => {
              router.replace("/admin/dashboard");
            }, 600);
          } else if (data.token) {
            // Customer signed in
            const result = await customerLogin(cleanIdentifier, password);
            if (result.success) {
              router.push(returnUrl);
            } else {
              setErrorMessage(result.error || "Login failed. Please check your credentials.");
            }
          }
        } else {
          setErrorMessage(data.error || "Invalid credentials. Please verify your information or create an account.");
        }
      }
    } catch (err: any) {
      setErrorMessage("Could not connect to the authentication server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register submission (Customer only)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    const result = await customerRegister(regName.trim(), regEmail.trim(), regPhone.trim(), regPassword);
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage("Account created successfully! Redirecting...");
      setTimeout(() => {
        router.push(returnUrl);
      }, 800);
    } else {
      setErrorMessage(result.error || "Registration failed. Please check your information.");
    }
  };

  return (
    <div className="bg-brand-cream min-h-screen py-12 md:py-20 flex items-center justify-center px-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-brand-border"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img
              src="/logo.png"
              alt="Flavor House"
              className="h-16 w-auto mx-auto object-contain brightness-0"
            />
          </Link>
          <h1 className="font-heading text-3xl font-bold text-brand-dark">
            {activeTab === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="font-sans text-brand-text/70 text-sm mt-1">
            {mode === "admin"
              ? "Sign in to access your administrative dashboard"
              : activeTab === "login"
              ? "Sign in to manage your orders & addresses"
              : "Register to track your orders and save addresses"}
          </p>
        </div>

        {/* Tab switch (Displayed only for customer authentication; Admins have Login only) */}
        {mode === "customer" && (
          <div className="flex bg-brand-cream p-1 rounded-2xl mb-6 border border-brand-border/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMessage("");
                setSuccessMessage("");
                setCustomerBlockedFromAdmin(false);
              }}
              className={`flex-1 py-2.5 text-xs font-button font-bold uppercase tracking-wider rounded-xl transition-all ${
                activeTab === "login"
                  ? "bg-white text-brand-primary shadow-xs"
                  : "text-brand-text/70 hover:text-brand-dark"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMessage("");
                setSuccessMessage("");
                setCustomerBlockedFromAdmin(false);
              }}
              className={`flex-1 py-2.5 text-xs font-button font-bold uppercase tracking-wider rounded-xl transition-all ${
                activeTab === "register"
                  ? "bg-white text-brand-primary shadow-xs"
                  : "text-brand-text/70 hover:text-brand-dark"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Alert Messages */}
        {errorMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-start gap-2.5 text-xs ${
              customerBlockedFromAdmin
                ? "bg-amber-50 border border-amber-200 text-amber-900"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {customerBlockedFromAdmin ? (
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            )}
            <div className="flex-1">
              <p>{errorMessage}</p>
              {customerBlockedFromAdmin && (
                <div className="mt-2.5 pt-2 border-t border-amber-200/60">
                  <Link
                    href="/account/login"
                    className="inline-flex items-center gap-1 font-bold text-amber-800 hover:text-brand-primary underline"
                  >
                    Go to Customer Portal Sign In
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-2xl flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Informative notice for guest customers on customer login */}
        {mode === "customer" && activeTab === "login" && (
          <div className="mb-6 p-3.5 bg-brand-cream/60 rounded-xl border border-brand-border/50 text-[11px] text-brand-text/80 leading-relaxed">
            💡 <strong>Placed an order before?</strong> Use the same email or mobile number you used during checkout to view your entire order history.
          </div>
        )}

        {/* Login Form */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                {mode === "admin" ? "Admin Email Address" : "Email Address or Phone"}
              </label>
              <div className="relative">
                <input
                  type={mode === "admin" ? "email" : "text"}
                  required
                  placeholder={mode === "admin" ? "admin@flavorhouse.com" : "your.email@example.com or 9876543210"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-brand-cream/30 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-brand-dark"
                />
                <User className="w-4 h-4 text-brand-text/50 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-brand-cream/30 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-brand-dark"
                />
                <Lock className="w-4 h-4 text-brand-text/50 absolute left-4 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-brand-text/50 hover:text-brand-dark cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-6 bg-brand-primary text-white rounded-xl shadow-lg hover:bg-brand-primaryHover transition-all flex items-center justify-center gap-2 font-button font-bold text-xs uppercase tracking-widest disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Customer Registration Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-brand-cream/30 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-brand-dark"
                />
                <User className="w-4 h-4 text-brand-text/50 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-brand-cream/30 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-brand-dark"
                />
                <Mail className="w-4 h-4 text-brand-text/50 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-11 pr-4 py-3 bg-brand-cream/30 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-brand-dark"
                />
                <Phone className="w-4 h-4 text-brand-text/50 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-brand-cream/30 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-brand-dark"
                />
                <Lock className="w-4 h-4 text-brand-text/50 absolute left-4 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-brand-text/50 hover:text-brand-dark cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-6 bg-brand-primary text-white rounded-xl shadow-lg hover:bg-brand-primaryHover transition-all flex items-center justify-center gap-2 font-button font-bold text-xs uppercase tracking-widest disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-brand-border/60 text-center text-xs text-brand-text/60">
          {mode === "admin" ? (
            <Link href="/" className="text-brand-primary font-semibold hover:underline">
              ← Return to Customer Storefront
            </Link>
          ) : (
            <Link href="/products" className="text-brand-primary font-semibold hover:underline">
              Continue Shopping as Guest
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}

