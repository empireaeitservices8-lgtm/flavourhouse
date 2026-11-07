"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { fetchFromBackend, BACKEND_URL, getAdminToken } from "@/lib/api";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stock, setStock] = useState("");
  const [SKU, setSKU] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetchFromBackend("/api/categories"),
      fetchFromBackend(`/api/admin/products/${productId}`),
    ]).then(([catRes, prodRes]) => {
      if (catRes.ok && Array.isArray(catRes.data) && catRes.data.length > 0) {
        setCategories(catRes.data);
      } else {
        fetch("/api/categories")
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) setCategories(data);
          })
          .catch(() => {});
      }

      const p = prodRes.ok ? (prodRes.data?.data || prodRes.data) : null;
      if (p && p.name) {
        setName(p.name || "");
        setCategory(p.category || "Pasta");
        setPrice(p.price?.toString() || "");
        setDiscountPrice(p.discountPrice ? p.discountPrice.toString() : "");
        setStock(p.stock !== undefined ? p.stock.toString() : "0");
        setSKU(p.SKU || "");
        setImage(p.image || "");
        setDescription(p.description || "");
        setIsActive(p.isActive !== false);
        setIsFeatured(Boolean(p.isFeatured));
      } else {
        // Fallback to public products endpoint
        fetch(`/api/products/${productId}`)
          .then((r) => r.json())
          .then((pubP) => {
            if (pubP && pubP.name) {
              setName(pubP.name || "");
              setCategory(pubP.category || "Pasta");
              setPrice(pubP.price?.toString() || "");
              setDiscountPrice(pubP.discountPrice ? pubP.discountPrice.toString() : "");
              setStock(pubP.stock !== undefined ? pubP.stock.toString() : "0");
              setSKU(pubP.SKU || "");
              setImage(pubP.image || "");
              setDescription(pubP.description || "");
              setIsActive(pubP.isActive !== false);
              setIsFeatured(Boolean(pubP.isFeatured));
            } else {
              setFormError("Could not load product details.");
            }
          })
          .catch(() => setFormError("Could not load product details."));
      }
      setIsLoading(false);
    });
  }, [productId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

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
        setImage(data.url);
      } else {
        setUploadError(data.error || "Failed to upload image.");
      }
    } catch {
      setUploadError("Network error while uploading image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setFormError("Please enter a valid regular price greater than 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetchFromBackend(`/api/admin/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          category,
          price: Number(price),
          discountPrice: discountPrice ? Number(discountPrice) : null,
          stock: Number(stock) || 0,
          SKU: SKU.trim() || undefined,
          image: image.trim() || undefined,
          description: description.trim() || undefined,
          isActive,
          isFeatured,
        }),
      });

      if (res.ok && res.data.success) {
        setSuccessMsg("Product updated successfully!");
        setTimeout(() => router.push("/admin/products"), 1000);
      } else {
        setFormError(res.data.error || "Failed to update product.");
      }
    } catch {
      setFormError("Failed to connect to backend server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-stone-400">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs">Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="p-2.5 rounded-xl bg-white border border-[#E9DDC5] text-[#6E5432] hover:text-[#B8945F] hover:border-[#B8945F] transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#6E5432]">
            Edit Product: {name}
          </h1>
          <p className="text-xs font-sans text-[#A17D49] mt-1">
            Update product parameters, inventory levels, and catalog visibility.
          </p>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
            >
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
              SKU (Stock Keeping Unit)
            </label>
            <input
              type="text"
              value={SKU}
              onChange={(e) => setSKU(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
              Regular Price (₹) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
              Discount Price (₹) (Optional)
            </label>
            <input
              type="number"
              step="any"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              placeholder="Leave empty if no discount"
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
              Product Image
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {image ? (
                <img
                  src={image}
                  alt="Product preview"
                  className="w-24 h-24 rounded-2xl object-cover border border-stone-200 bg-stone-100 shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 bg-stone-50 shrink-0">
                  <ImageIcon className="w-8 h-8 opacity-50" />
                </div>
              )}

              <div className="flex-1 space-y-2 w-full">
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Paste image URL (https://...)"
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  {isUploading && (
                    <span className="text-xs text-amber-600 animate-pulse">Uploading image...</span>
                  )}
                </div>
                {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-6 md:col-span-2 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Active in Customer Catalog</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Featured Product</span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-100 flex items-center justify-end gap-3">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

