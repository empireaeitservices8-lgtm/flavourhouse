"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Check,
  X,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api";

interface ProductItem {
  id: number;
  name: string;
  slug: string;
  category: string;
  categoryId?: number;
  price: number;
  discountPrice?: number | null;
  image: string;
  description?: string;
  stock: number;
  inStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  SKU?: string;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");

  // Deletion modal state
  const [deleteProduct, setDeleteProduct] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetchFromBackend("/api/admin/products");
      if (res.ok && res.data.products) {
        setProducts(res.data.products);
        setCategories(["All", ...(res.data.categories || [])]);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Toggle active/inactive
  const handleToggleActive = async (product: ProductItem) => {
    try {
      const res = await fetchFromBackend(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
        );
        showNotification(
          `Product "${product.name}" marked as ${!product.isActive ? "Active" : "Inactive"}.`
        );
      }
    } catch {
      showNotification("Failed to update status", "error");
    }
  };

  // Confirm delete product
  const handleConfirmDelete = async () => {
    if (!deleteProduct) return;
    setIsDeleting(true);

    try {
      const res = await fetchFromBackend(`/api/admin/products/${deleteProduct.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (res.data.action === "deactivated") {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === deleteProduct.id ? { ...p, isActive: false, stock: 0 } : p
            )
          );
          showNotification(res.data.message || "Product deactivated safely.");
        } else {
          setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
          showNotification("Product deleted successfully.");
        }
      } else {
        showNotification(res.data.error || "Failed to delete product.", "error");
      }
    } catch {
      showNotification("Error communicating with backend.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteProduct(null);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.SKU && p.SKU.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        categoryFilter === "All" ||
        p.category.toLowerCase() === categoryFilter.toLowerCase();

      let matchesStatus = true;
      if (statusFilter === "active") matchesStatus = p.isActive;
      if (statusFilter === "inactive") matchesStatus = !p.isActive;
      if (statusFilter === "low-stock") matchesStatus = p.stock <= 10;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 ${
            notification.type === "success"
              ? "bg-[#2E251A] text-[#FFFDF8] border-[#B8945F]"
              : "bg-red-950 text-red-100 border-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-[#B8945F]" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#6E5432]">
            Products Catalog
          </h1>
          <p className="text-xs font-sans text-[#A17D49] mt-1">
            Manage your organic and millet products catalog, pricing, inventory, and visibility.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B8945F] hover:bg-[#A17D49] text-white rounded-xl text-xs font-button font-medium shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9DDC5] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A17D49] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#E9DDC5] text-[#3F3424] focus:outline-none focus:border-[#B8945F] focus:bg-white transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#E9DDC5] text-[#6E5432] font-button focus:outline-none focus:border-[#B8945F]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Categories" : c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#E9DDC5] text-[#6E5432] font-button focus:outline-none focus:border-[#B8945F]"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="low-stock">Low Stock (≤10)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#E9DDC5] shadow-xs overflow-hidden">
        {isLoading && products.length === 0 ? (
          <div className="py-16 text-center text-[#A17D49] text-sm">
            <div className="w-8 h-8 border-4 border-[#B8945F]/30 border-t-[#B8945F] rounded-full animate-spin mx-auto mb-3"></div>
            Loading products from database...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-[#A17D49] text-sm">
            <Package className="w-10 h-10 mx-auto text-[#B8945F]/50 mb-2" />
            <p>No products match your current search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E9DDC5] text-[#A17D49] uppercase tracking-wider font-button font-semibold">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Inventory</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4E8D0]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF7F2]/60 transition">
                    {/* Image & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover bg-[#F4E8D0] shrink-0 border border-[#E9DDC5]"
                        />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-[#3F3424] truncate max-w-xs">{p.name}</p>
                          <p className="text-[11px] text-[#A17D49] font-mono">{p.SKU || `#${p.id}`}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-button bg-[#F8F1D8] text-[#6E5432] border border-[#E9DDC5]">
                        {p.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-sans">
                        {p.discountPrice && Number(p.discountPrice) > 0 && Number(p.discountPrice) < Number(p.price) ? (
                          <>
                            <span className="font-bold text-[#3F3424]">₹{p.discountPrice}</span>
                            <span className="text-[11px] text-[#A17D49] line-through">
                              ₹{p.price}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-[#3F3424]">₹{p.price}</span>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold font-sans ${
                            p.stock <= 5
                              ? "text-red-600"
                              : p.stock <= 15
                              ? "text-amber-700"
                              : "text-[#3F3424]"
                          }`}
                        >
                          {p.stock} units
                        </span>
                        {p.stock <= 10 && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        )}
                      </div>
                    </td>

                    {/* Active toggle badge */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-button font-semibold border transition cursor-pointer ${
                          p.isActive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            : "bg-[#FAF7F2] text-[#A17D49] border-[#E9DDC5] hover:bg-[#F4E8D0]"
                        }`}
                        title="Click to toggle product visibility"
                      >
                        {p.isActive ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-stone-500" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/products/${p.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-[#A17D49] hover:text-[#6E5432] hover:bg-[#FAF7F2] transition"
                          title="View on store"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/products/edit/${p.id}`}
                          className="p-1.5 rounded-lg text-[#A17D49] hover:text-[#B8945F] hover:bg-[#F8F1D8] transition"
                          title="Edit product"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteProduct(p)}
                          className="p-1.5 rounded-lg text-[#A17D49] hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                          title="Delete or deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E9DDC5] animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mb-4 border border-red-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#6E5432] font-heading">
              Remove Product
            </h3>
            <p className="text-xs text-[#3F3424] mt-2 leading-relaxed font-sans">
              Are you sure you want to remove <strong className="text-[#6E5432]">"{deleteProduct.name}"</strong>?
              If this product is associated with existing customer orders, it will be automatically deactivated rather than breaking historical customer records.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteProduct(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E9DDC5] text-[#6E5432] text-xs font-button hover:bg-[#FAF7F2] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-button shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Processing..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
