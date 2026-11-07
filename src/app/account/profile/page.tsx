"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowRight,
} from "lucide-react";
import { BACKEND_URL, getCustomerToken } from "@/lib/api";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

export default function MyProfilePage() {
  const router = useRouter();
  const { customer, isLoggedIn, isLoading: authLoading, refreshCustomer, updateProfileState } =
    useCustomerAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/account/login?returnUrl=/account/profile");
      return;
    }

    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setAlternatePhone(customer.alternatePhone || "");
    }
  }, [customer, isLoggedIn, authLoading, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    const token = getCustomerToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          alternatePhone: alternatePhone.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        updateProfileState(data.customer);
        setSuccessMsg("Profile information updated successfully.");
        await refreshCustomer();
      } else {
        setErrorMsg(data.error || "Failed to update profile.");
      }
    } catch (err: any) {
      setErrorMsg("Could not reach backend to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] bg-brand-cream flex flex-col items-center justify-center py-20 px-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-heading text-xl text-brand-dark">Loading your profile...</p>
      </div>
    );
  }

  const memberSince = customer?.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "Valued Member";

  return (
    <div className="bg-brand-cream min-h-screen py-10 md:py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Navigation & Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-sans text-brand-text/60 mb-2">
            <Link href="/" className="hover:text-brand-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-brand-dark font-semibold">Account</span>
            <span>/</span>
            <span className="text-brand-primary font-semibold">Profile</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-brand-dark">
            My Profile
          </h1>
          <p className="font-sans text-brand-text/70 text-sm mt-1">
            Manage your personal information and contact preferences.
          </p>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-cream text-brand-primary flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-brand-text/60 font-semibold font-button">
                Membership
              </p>
              <p className="font-bold text-brand-dark text-sm mt-0.5">{memberSince}</p>
            </div>
          </div>

          <Link
            href="/account/orders"
            className="bg-white p-5 rounded-3xl border border-brand-border shadow-sm hover:border-brand-primary transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-cream text-brand-primary flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wider text-brand-text/60 font-semibold font-button">
                Total Orders
              </p>
              <p className="font-bold text-brand-dark text-sm mt-0.5">
                {customer?.totalOrders ?? 0} {customer?.totalOrders === 1 ? "order" : "orders"}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-text/40 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/account/addresses"
            className="bg-white p-5 rounded-3xl border border-brand-border shadow-sm hover:border-brand-primary transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-cream text-brand-primary flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wider text-brand-text/60 font-semibold font-button">
                Saved Addresses
              </p>
              <p className="font-bold text-brand-dark text-sm mt-0.5">
                {customer?.totalAddresses ?? 0} {customer?.totalAddresses === 1 ? "address" : "addresses"}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-text/40 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Profile Edit Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 md:p-10 border border-brand-border shadow-xl font-sans"
        >
          <h2 className="font-heading text-2xl font-bold text-brand-dark mb-6">
            Personal Details
          </h2>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-2xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-brand-cream/30 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary text-brand-dark"
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
                    disabled
                    value={customer?.email || ""}
                    className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-brand-border/60 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                  />
                  <Mail className="w-4 h-4 text-brand-text/40 absolute left-4 top-3.5" />
                </div>
                <span className="text-[10px] text-brand-text/50 mt-1 block">
                  Email address is linked to your order account and cannot be changed directly.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                  Primary Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-11 pr-4 py-3 bg-brand-cream/30 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary text-brand-dark"
                  />
                  <Phone className="w-4 h-4 text-brand-text/50 absolute left-4 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
                  Alternate Phone (Optional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={10}
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Optional backup number"
                    className="w-full pl-11 pr-4 py-3 bg-brand-cream/30 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary text-brand-dark"
                  />
                  <Phone className="w-4 h-4 text-brand-text/50 absolute left-4 top-3.5" />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="py-3.5 px-8 bg-brand-primary text-white rounded-xl shadow-lg hover:bg-brand-primaryHover transition-all flex items-center gap-2 font-button font-bold text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

