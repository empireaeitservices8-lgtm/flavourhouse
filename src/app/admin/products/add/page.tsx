"use client";

import { useState, useEffect } from "react";
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

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Pasta");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stock, setStock] = useState("50");
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

  useEffect(() => {
    fetchFromBackend("/api/categories").then((res) => {
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
        setCategory(res.data[0].name);
      } else {
        fetch("/api/categories")
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              setCategories(data);
              setCategory(data[0].name);
            }
          })
          .catch(() => {});
      }
    });
  }, []);

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
    } catch (err: any) {
      setUploadError("Network error while uploading image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setFormError("Please enter a valid regular price greater than 0.");
      return;
    }

    const finalCategory = category.trim();
    if (!finalCategory) {
      setFormError("Please select a product category.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetchFromBackend("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          category: finalCategory,
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

      if (res.ok && res.data?.success) {
        router.push("/admin/products");
      } else {
        setFormError(res.data?.error || "Failed to save product.");
      }
    } catch (err: any) {
      setFormError("Failed to connect to backend server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="p-2.5 rounded-xl bg-white border border-[#E9DDC5] text-[#6E5432] hover:text-[#B8945F] hover:border-[#B8945F] transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#6E5432]">
            Add New Product
          </h1>
          <p className="text-xs font-sans text-[#A17D49]">
            Create a new organic product in the Flavour House catalog.
          </p>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E9DDC5] shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-button font-semibold uppercase text-[#A17D49] tracking-wider mb-2">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Foxtail Pasta Penne"
              className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-[#3F3424] text-sm font-sans focus:outline-none focus:border-[#B8945F] focus:bg-white transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-button font-semibold uppercase text-[#A17D49] tracking-wider mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-[#3F3424] text-sm font-sans focus:outline-none focus:border-[#B8945F] focus:bg-white transition cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* SKU */}
          <div>
            <label className="block text-xs font-button font-semibold uppercase text-[#A17D49] tracking-wider mb-2">
              SKU (Stock Keeping Unit)
            </label>
            <input
              type="text"
              value={SKU}
              onChange={(e) => setSKU(e.target.value)}
              placeholder="e.g. FH-PASTA-001 (auto if empty)"
              className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-[#3F3424] text-sm font-sans focus:outline-none focus:border-[#B8945F] focus:bg-white transition"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-button font-semibold uppercase text-[#A17D49] tracking-wider mb-2">
              Regular Price (₹) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="180"
              className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-[#3F3424] text-sm font-sans focus:outline-none focus:border-[#B8945F] focus:bg-white transition"
            />
          </div>

          {/* Discount Price */}
          <div>
            <label className="block text-xs font-button font-semibold uppercase text-[#A17D49] tracking-wider mb-2">
              Discount Price (₹) (Optional)
            </label>
            <input
              type="number"
              step="any"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              placeholder="e.g. 150"
              className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-[#3F3424] text-sm font-sans focus:outline-none focus:border-[#B8945F] focus:bg-white transition"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-xs font-button font-semibold uppercase text-[#A17D49] tracking-wider mb-2">
              Initial Stock Quantity *
            </label>
            <input
              type="number"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="50"
              className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-[#3F3424] text-sm font-sans focus:outline-none focus:border-[#B8945F] focus:bg-white transition"
            />
          </div>

          {/* Image Upload & Preview */}
          <div className="md:col-span-2">
            <label className="block text-xs font-button font-semibold uppercase text-[#A17D49] tracking-wider mb-2">
              Product Image
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {image ? (
                <img
                  src={image}
                  alt="Product preview"
                  className="w-24 h-24 rounded-2xl object-cover border border-[#E9DDC5] bg-[#F4E8D0] shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#E9DDC5] flex items-center justify-center text-[#A17D49] bg-[#FAF7F2] shrink-0">
                  <ImageIcon className="w-8 h-8 opacity-60" />
                </div>
              )}

              <div className="flex-1 space-y-2 w-full">
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Paste image URL (https://...)"
                  className="w-full px-4 py-2 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-xs text-[#3F3424] focus:outline-none focus:border-[#B8945F]"
                />
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F1D8] hover:bg-[#F4E8D0] text-[#6E5432] text-xs font-button cursor-pointer transition border border-[#E9DDC5]">
                    <Upload className="w-3.5 h-3.5 text-[#B8945F]" />
                    <span>Upload Image from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  {isUploading && (
                    <span className="text-xs text-[#B8945F] animate-pulse font-sans">Uploading image...</span>
                  )}
                </div>
                {uploadError && <p className="text-xs text-red-600 font-sans">{uploadError}</p>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-button font-semibold uppercase text-[#A17D49] tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wholesome organic millet pasta crafted with traditional stone milling..."
              className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-[#3F3424] text-sm font-sans focus:outline-none focus:border-[#B8945F] focus:bg-white transition"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 md:col-span-2 pt-2">
            <label className="flex items-center gap-2 text-xs font-button text-[#6E5432] cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#B8945F] focus:ring-[#B8945F] accent-[#B8945F]"
              />
              <span>Active in Customer Catalog</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-button text-[#6E5432] cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-[#B8945F] focus:ring-[#B8945F] accent-[#B8945F]"
              />
              <span>Feature on Customer Homepage</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-[#E9DDC5] flex items-center justify-end gap-3">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 rounded-xl border border-[#E9DDC5] text-[#6E5432] text-xs font-button font-medium hover:bg-[#FAF7F2] transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#B8945F] hover:bg-[#A17D49] text-white text-xs font-button font-medium shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Saving Product..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
