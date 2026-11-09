"use client";

import { useEffect, useState } from "react";
import {
  Store,
  CheckCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Truck,
  Phone,
  Mail,
  MapPin,
  Globe,
  Share2,
  Eye,
  EyeOff,
  Send,
  Bell,
} from "lucide-react";
import { fetchFromBackend, BACKEND_URL, getAdminToken } from "@/lib/api";

export default function AdminStoreSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Settings State
  const [storeName, setStoreName] = useState("");
  const [logo, setLogo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("50");
  const [minFreeDelivery, setMinFreeDelivery] = useState("500");
  const [storeAvailability, setStoreAvailability] = useState(true);
  // Social Media
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // Email Notification & SMTP Settings
  const [orderNotificationEmail, setOrderNotificationEmail] = useState("");
  const [smtpHost, setSmtpHost] = useState("smtp.hostinger.com");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  // Test Email
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchFromBackend("/api/admin/store/settings").then((res) => {
      if (res.ok && res.data.settings) {
        const s = res.data.settings;
        setStoreName(s.storeName || "Flavour House");
        setLogo(s.logo || "");
        setEmail(s.email || "");
        setPhone(s.phone || "");
        setAddress(s.address || "");
        setDeliveryCharge(s.deliveryCharge?.toString() || "50");
        setMinFreeDelivery(s.minFreeDelivery?.toString() || "500");
        setStoreAvailability(s.storeAvailability !== false);
        setFacebookUrl(s.facebookUrl || "");
        setInstagramUrl(s.instagramUrl || "");
        setYoutubeUrl(s.youtubeUrl || "");
        setOrderNotificationEmail(s.orderNotificationEmail || s.email || "");
        setSmtpHost(s.smtpHost || "smtp.hostinger.com");
        setSmtpPort(s.smtpPort?.toString() || "465");
        setSmtpUser(s.smtpUser || s.email || "");
        setSmtpPass(s.smtpPass || "");
        setEmailNotificationsEnabled(s.emailNotificationsEnabled !== 0);
        setTestEmailAddress(s.orderNotificationEmail || s.email || "");
      }
      setIsLoading(false);
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = getAdminToken();
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setLogo(data.url);
      }
    } catch {
      console.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetchFromBackend("/api/admin/store/settings", {
        method: "PUT",
        body: JSON.stringify({
          storeName,
          logo,
          email,
          phone,
          address,
          deliveryCharge: Number(deliveryCharge),
          minFreeDelivery: Number(minFreeDelivery),
          storeAvailability,
          facebookUrl,
          instagramUrl,
          youtubeUrl,
          orderNotificationEmail,
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpUser,
          smtpPass,
          emailNotificationsEnabled,
        }),
      });

      if (res.ok && res.data.success) {
        setFeedback({ message: "Store & Email settings saved successfully!", type: "success" });
      } else {
        setFeedback({ message: res.data.error || "Failed to update settings.", type: "error" });
      }
    } catch {
      setFeedback({ message: "Network error saving settings.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      setTestFeedback({ message: "Please enter a valid email address for the test.", type: "error" });
      return;
    }

    setIsSendingTest(true);
    setTestFeedback(null);

    try {
      const res = await fetchFromBackend("/api/admin/store/test-email", {
        method: "POST",
        body: JSON.stringify({ toEmail: testEmailAddress }),
      });

      if (res.ok && res.data.success) {
        setTestFeedback({ message: res.data.message || "Test email sent successfully! Please check your inbox.", type: "success" });
      } else {
        setTestFeedback({ message: res.data.error || "Failed to send test email. Check your SMTP settings.", type: "error" });
      }
    } catch {
      setTestFeedback({ message: "Network error sending test email.", type: "error" });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-stone-400">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs">Loading store configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#6E5432]">
          Store Configuration
        </h1>
        <p className="text-xs font-sans text-[#A17D49] mt-1">
          Configure store contact info, shipping rates, free delivery thresholds, and social links.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${feedback.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Brand Info */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
          <h2 className="font-heading font-bold text-stone-900 text-sm flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-500" />
            <span>Brand Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                Store Name
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            {/* Store Availability Toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                Store Order Acceptance Status
              </label>
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeAvailability}
                    onChange={(e) => setStoreAvailability(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-3 text-xs font-semibold text-stone-700">
                    {storeAvailability ? "Store Open (Accepting Orders)" : "Store Closed (Ordering Paused)"}
                  </span>
                </label>
              </div>
            </div>

            {/* Logo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                Store Logo
              </label>
              <div className="flex items-center gap-4">
                {logo ? (
                  <img
                    src={logo}
                    alt="Store logo"
                    className="w-16 h-16 rounded-xl object-contain bg-stone-100 p-2 border border-stone-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 bg-stone-50">
                    <ImageIcon className="w-6 h-6 opacity-40" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="/logo.png or https://..."
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Logo</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {isUploading && <span className="text-xs text-amber-600 ml-2 animate-pulse">Uploading...</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Policy */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="font-heading font-bold text-stone-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              <span>Shipping & Checkout Policies</span>
            </h2>
            <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Tiered Delivery: ₹70 (≤₹500) • ₹100 (₹501–₹1000) • FREE (&gt;₹1000)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                Standard Delivery Charge (₹)
              </label>
              <input
                type="number"
                required
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Applied when the order subtotal is below the free delivery threshold.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                Free Delivery Threshold (₹)
              </label>
              <input
                type="number"
                required
                value={minFreeDelivery}
                onChange={(e) => setMinFreeDelivery(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Orders with subtotal equal or above this qualify for FREE delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
          <h2 className="font-heading font-bold text-stone-900 text-sm flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-500" />
            <span>Customer Support & Location</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                Support Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                Physical Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
          <h2 className="font-heading font-bold text-stone-900 text-sm flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-500" />
            <span>Social Media Channels</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1">
                Facebook Page URL
              </label>
              <input
                type="text"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1">
                Instagram Profile URL
              </label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1">
                YouTube Channel URL
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@..."
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Order Email Notifications & SMTP Configuration */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
            <h2 className="font-heading font-bold text-stone-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Order Email Notifications</span>
            </h2>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotificationsEnabled}
                  onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-xs font-semibold text-stone-700">
                  {emailNotificationsEnabled ? "Notifications Active" : "Notifications Disabled"}
                </span>
              </label>
            </div>
          </div>

          <p className="text-xs text-stone-500 leading-relaxed">
            When a customer places an order, an automated email notification will be immediately dispatched to the store admin and an order confirmation will be sent to the customer.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                Admin Notification Email (Where you receive order alerts)
              </label>
              <input
                type="email"
                value={orderNotificationEmail}
                onChange={(e) => setOrderNotificationEmail(e.target.value)}
                placeholder="orders@flavorhousefoods.com or your personal email"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                You can enter multiple emails separated by comma if desired.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                SMTP Host Server
              </label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.hostinger.com or smtp.gmail.com"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                SMTP Port
              </label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="465 (SSL) or 587 (TLS)"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                SMTP Username / Mailbox
              </label>
              <input
                type="text"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="support@flavorhousefoods.com"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
                SMTP Password
              </label>
              <div className="relative">
                <input
                  type={showSmtpPass ? "text" : "password"}
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="Enter email account password"
                  className="w-full pl-4 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass(!showSmtpPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Test Email Tester Bar */}
          <div className="mt-4 pt-4 border-t border-stone-100 bg-stone-50 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-amber-600" />
              <span>Verify & Test Email Sending</span>
            </h3>

            {testFeedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {testFeedback.type === "success" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <span>{testFeedback.message}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="Enter email to receive test message"
                className="flex-1 px-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isSendingTest ? "Sending Test..." : "Send Test Email"}
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving Configuration..." : "Save Store Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}

