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
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchFromBackend("/api/store/settings").then((res) => {
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
        }),
      });

      if (res.ok && res.data.success) {
        setFeedback({ message: "Store settings saved successfully!", type: "success" });
      } else {
        setFeedback({ message: res.data.error || "Failed to update settings.", type: "error" });
      }
    } catch {
      setFeedback({ message: "Network error saving settings.", type: "error" });
    } finally {
      setIsSaving(false);
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

