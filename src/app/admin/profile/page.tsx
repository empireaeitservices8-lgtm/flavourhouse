"use client";

import { useEffect, useState } from "react";
import {
  UserCheck,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { fetchFromBackend, setAdminToken } from "@/lib/api";

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<{ id: number; name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Name Update
  const [name, setName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameFeedback, setNameFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Email Update
  const [email, setEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Password Update
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Show / hide password toggles
  const [showEmailCurrentPassword, setShowEmailCurrentPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchFromBackend("/api/admin/auth/me").then((res) => {
      if (res.ok && res.data.admin) {
        setAdmin(res.data.admin);
        setName(res.data.admin.name);
        setEmail(res.data.admin.email);
      }
      setIsLoading(false);
    });
  }, []);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameFeedback(null);
    setIsUpdatingName(true);

    try {
      const res = await fetchFromBackend("/api/admin/profile", {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      if (res.ok && res.data.success) {
        setNameFeedback({ message: "Admin name updated successfully.", type: "success" });
        setAdmin((prev) => (prev ? { ...prev, name } : prev));
      } else {
        setNameFeedback({ message: res.data.error || "Failed to update name.", type: "error" });
      }
    } catch {
      setNameFeedback({ message: "Connection error", type: "error" });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailFeedback(null);
    setIsUpdatingEmail(true);

    try {
      const res = await fetchFromBackend("/api/admin/profile/email", {
        method: "PUT",
        body: JSON.stringify({ email, password: emailCurrentPassword }),
      });
      if (res.ok && res.data.success) {
        if (res.data.token) {
          setAdminToken(res.data.token);
        }
        setEmailFeedback({
          message: res.data.message || "Admin email updated successfully. The previous email has been permanently decommissioned.",
          type: "success",
        });
        setEmailCurrentPassword("");
        setAdmin((prev) => (prev ? { ...prev, email: res.data.admin?.email || email } : prev));
      } else {
        setEmailFeedback({ message: res.data.error || "Failed to update email.", type: "error" });
      }
    } catch {
      setEmailFeedback({ message: "Connection error", type: "error" });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ message: "New passwords do not match.", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFeedback({ message: "New password must be at least 6 characters.", type: "error" });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const res = await fetchFromBackend("/api/admin/profile/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok && res.data.success) {
        if (res.data.token) {
          setAdminToken(res.data.token);
        }
        setPasswordFeedback({
          message: res.data.message || "Password updated successfully. The previous password has been permanently revoked.",
          type: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordFeedback({ message: res.data.error || "Failed to change password.", type: "error" });
      }
    } catch {
      setPasswordFeedback({ message: "Connection error", type: "error" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-stone-400">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#6E5432]">
          Admin Profile & Security
        </h1>
        <p className="text-xs font-sans text-[#A17D49] mt-1">
          Manage your administrator identity, contact email, and password credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E9DDC5] shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#FAF7F2]">
            <div className="w-10 h-10 rounded-xl bg-[#B8945F]/15 text-[#B8945F] flex items-center justify-center border border-[#E9DDC5]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-[#6E5432] text-sm">
                General Profile
              </h2>
              <p className="text-[11px] text-[#A17D49]">Administrator display name</p>
            </div>
          </div>

          {nameFeedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${nameFeedback.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
              {nameFeedback.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
              <span>{nameFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                Administrator Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isUpdatingName}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
              >
                {isUpdatingName ? "Saving..." : "Update Name"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(admin?.name || "");
                  setNameFeedback(null);
                }}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Update Email */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-stone-900 text-sm">
                Login Email Address
              </h2>
              <p className="text-[11px] text-stone-400">Requires current password confirmation</p>
            </div>
          </div>

          {emailFeedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${emailFeedback.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
              {emailFeedback.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
              <span>{emailFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E9DDC5] text-xs flex items-center justify-between">
              <span className="text-stone-500">Current Login Account:</span>
              <strong className="text-stone-900 font-mono font-bold">••••••••@••••••.com</strong>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                New Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showEmailCurrentPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder=""
                  value={emailCurrentPassword}
                  onChange={(e) => setEmailCurrentPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowEmailCurrentPassword((prev) => !prev)}
                  className="absolute right-4 top-3 text-stone-400 hover:text-amber-600 transition cursor-pointer"
                  aria-label={showEmailCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showEmailCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isUpdatingEmail}
                className="flex-1 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
              >
                {isUpdatingEmail ? "Updating..." : "Update Email Address"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail(admin?.email || "");
                  setEmailCurrentPassword("");
                  setEmailFeedback(null);
                }}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-stone-900 text-base">
              Change Administrator Password
            </h2>
            <p className="text-xs text-stone-400">
              Passwords are cryptographically hashed with bcrypt in the MySQL database.
            </p>
          </div>
        </div>

        {passwordFeedback && (
          <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${passwordFeedback.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {passwordFeedback.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
            <span>{passwordFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute right-4 top-3 text-stone-400 hover:text-amber-600 transition cursor-pointer"
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
              New Password (minimum 6 characters) *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-4 top-3 text-stone-400 hover:text-amber-600 transition cursor-pointer"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-3 text-stone-400 hover:text-amber-600 transition cursor-pointer"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="py-2.5 px-6 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
            >
              {isUpdatingPassword ? "Updating Password..." : "Change Password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPasswordFeedback(null);
              }}
              className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}