"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  Search,
  LogOut,
  ExternalLink,
  Layers,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
  User,
  RefreshCw,
  Eye,
  DollarSign,
  Tag,
} from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  inStock?: boolean;
  createdAt?: string;
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formInStock, setFormInStock] = useState(true);

  // Image Upload state
  const [imageUploadType, setImageUploadType] = useState<"file" | "url">("file");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast / notification
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Check auth status on load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth");
      if (res.ok) {
        setIsAuthenticated(true);
        loadProducts();
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    } catch {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        loadProducts();
      } else {
        setAuthError(data.error || "Invalid username or password");
      }
    } catch {
      setAuthError("Failed to login. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      setIsAuthenticated(false);
      setProducts([]);
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Failed to load products", err);
      showNotification("Failed to load products", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    const defaultCat = categories.length > 0 && categories[0] !== "All" ? categories[0] : "Pasta";
    setFormCategory(defaultCat);
    setIsCustomCategory(false);
    setCustomCategoryName("");
    setFormPrice("");
    setFormDescription("");
    setFormImage("");
    setFormInStock(true);
    setImageUploadType("file");
    setModalError("");
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setIsCustomCategory(false);
    setCustomCategoryName("");
    setFormPrice(product.price.toString());
    setFormDescription(product.description || "");
    setFormImage(product.image);
    setFormInStock(product.inStock !== false);
    setImageUploadType(product.image.startsWith("/uploads/") ? "file" : "url");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setModalError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormImage(data.url);
        showNotification("Image uploaded successfully!");
      } else {
        setModalError(data.error || "Failed to upload image");
      }
    } catch {
      setModalError("Network error while uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!formName.trim()) {
      setModalError("Product name is required");
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setModalError("Please provide a valid price greater than 0");
      return;
    }

    const finalCategory = isCustomCategory ? customCategoryName.trim() : formCategory;
    if (!finalCategory) {
      setModalError("Category is required");
      return;
    }

    const finalImage = formImage.trim() || "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81";

    setIsSaving(true);

    try {
      const payload = {
        id: editingProduct?.id,
        name: formName.trim(),
        category: finalCategory,
        price: priceNum,
        description: formDescription.trim(),
        image: finalImage,
        inStock: formInStock,
      };

      const res = await fetch("/api/admin/products", {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsModalOpen(false);
        showNotification(
          editingProduct ? "Product updated successfully!" : "New product added successfully!"
        );
        loadProducts();
      } else {
        setModalError(data.error || "Failed to save product");
      }
    } catch {
      setModalError("An error occurred while saving product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Deleted "${product.name}"`);
        loadProducts();
      } else {
        showNotification(data.error || "Failed to delete product", "error");
      }
    } catch {
      showNotification("Error deleting product", "error");
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique categories for filtering
  const allFilterCategories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  // If loading initial auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#FBF8F1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#A17D49] animate-spin" />
          <p className="text-[#6E5432] font-medium">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#2A2218] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#FFFDF8] rounded-3xl p-8 md:p-10 shadow-2xl border border-[#E9DDC5]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F8F1D8] text-[#A17D49] mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#3F3424]">Flavor House</h1>
            <p className="text-xs uppercase tracking-widest text-[#A17D49] font-semibold mt-1">
              Admin Portal
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#6E5432] uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E9DDC5] bg-[#FBF8F1] text-[#3F3424] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#A17D49] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E5432] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E9DDC5] bg-[#FBF8F1] text-[#3F3424] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#A17D49] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-6 rounded-xl bg-[#A17D49] hover:bg-[#8C6936] text-white font-medium shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Logging In...
                </>
              ) : (
                "Sign In to Admin"
              )}
            </button>

            <div className="text-center pt-2">
              <Link href="/" className="text-xs text-[#A17D49] hover:underline flex items-center justify-center gap-1">
                &larr; Back to Public Website
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#3F3424]">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all ${
            notification.type === "success"
              ? "bg-[#2A2218] text-[#FFFDF8] border border-[#A17D49]"
              : "bg-red-800 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-300" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#FFFDF8] border-b border-[#E9DDC5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Flavor House" className="h-12 w-auto object-contain" />
            </Link>
            <div className="h-6 w-px bg-[#E9DDC5] hidden sm:block" />
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-[#F4E8D0] text-[#6E5432] text-xs font-semibold tracking-wider uppercase">
              Admin Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#6E5432] bg-[#F4E8D0] hover:bg-[#E9DDC5] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Website</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#FFFDF8] p-6 rounded-3xl border border-[#E9DDC5] shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F1D8] text-[#A17D49] flex items-center justify-center shrink-0">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#6E5432] font-semibold">Total Products</p>
              <p className="text-3xl font-serif font-bold text-[#3F3424] mt-0.5">{products.length}</p>
            </div>
          </div>

          <div className="bg-[#FFFDF8] p-6 rounded-3xl border border-[#E9DDC5] shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F1D8] text-[#A17D49] flex items-center justify-center shrink-0">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#6E5432] font-semibold">Categories</p>
              <p className="text-3xl font-serif font-bold text-[#3F3424] mt-0.5">
                {Array.from(new Set(products.map((p) => p.category))).length}
              </p>
            </div>
          </div>

          <div className="bg-[#FFFDF8] p-6 rounded-3xl border border-[#E9DDC5] shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#6E5432] font-semibold">In Stock</p>
              <p className="text-3xl font-serif font-bold text-[#3F3424] mt-0.5">
                {products.filter((p) => p.inStock !== false).length}
              </p>
            </div>
          </div>

          <div className="bg-[#FFFDF8] p-6 rounded-3xl border border-[#E9DDC5] shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F1D8] text-[#A17D49] flex items-center justify-center shrink-0">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#6E5432] font-semibold">Avg. Price</p>
              <p className="text-3xl font-serif font-bold text-[#3F3424] mt-0.5">
                ₹{products.length > 0 ? Math.round(products.reduce((acc, p) => acc + p.price, 0) / products.length) : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-[#FFFDF8] p-5 rounded-3xl border border-[#E9DDC5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9DDC5] bg-[#FBF8F1] text-sm text-[#3F3424] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#A17D49]"
              />
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[160px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E9DDC5] bg-[#FBF8F1] text-sm text-[#3F3424] focus:outline-none focus:ring-2 focus:ring-[#A17D49] appearance-none cursor-pointer"
              >
                {allFilterCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
              <Tag className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadProducts}
              className="p-2.5 rounded-xl border border-[#E9DDC5] hover:bg-[#F4E8D0] text-[#6E5432] transition-colors cursor-pointer"
              title="Refresh product list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-[#A17D49] hover:bg-[#8C6936] text-white font-medium text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-[#FFFDF8] rounded-3xl border border-[#E9DDC5] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-[#A17D49] animate-spin" />
              <p className="text-sm text-[#6E5432]">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center px-4">
              <Package className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
              <h3 className="text-lg font-serif font-bold text-[#3F3424]">No products found</h3>
              <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1">
                {searchQuery || selectedCategory !== "All"
                  ? "Try adjusting your search query or filter."
                  : "You haven't added any products yet."}
              </p>
              {searchQuery || selectedCategory !== "All" ? (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="mt-4 text-xs font-semibold text-[#A17D49] hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              ) : (
                <button
                  onClick={openAddModal}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#A17D49] text-white text-xs font-medium cursor-pointer"
                >
                  Add your first product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#F8F1D8] border-b border-[#E9DDC5] text-[#6E5432] text-xs uppercase tracking-wider font-semibold">
                    <th className="py-4 px-6">Product</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DDC5]/60">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[#FBF8F1] transition-colors">
                      {/* Product Name & Image */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-[#F4E8D0] overflow-hidden border border-[#E9DDC5] shrink-0">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81";
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-[#3F3424] leading-tight">{product.name}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">ID: #{product.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="inline-block px-3 py-1 rounded-full bg-[#F4E8D0] text-[#6E5432] text-xs font-medium">
                          {product.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 font-bold text-[#3F3424]">₹{product.price}</td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {product.inStock !== false ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 font-medium bg-neutral-100 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/products/${product.id}`}
                            target="_blank"
                            className="p-2 rounded-lg text-neutral-500 hover:text-[#A17D49] hover:bg-[#F4E8D0] transition-colors"
                            title="View on Live Store"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 rounded-lg text-neutral-500 hover:text-[#A17D49] hover:bg-[#F4E8D0] transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-2 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Product"
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
      </main>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFDF8] w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E9DDC5] my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#E9DDC5]">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#3F3424]">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-xs text-[#6E5432] mt-0.5">
                  {editingProduct
                    ? "Update product details and price"
                    : "Fill in the details to publish a new product to your store"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#F4E8D0] text-neutral-400 hover:text-[#3F3424] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="mt-6 space-y-5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-[#6E5432] uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Millet Moringa Pasta Penne"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9DDC5] bg-[#FBF8F1] text-sm text-[#3F3424] focus:outline-none focus:ring-2 focus:ring-[#A17D49]"
                />
              </div>

              {/* Category & Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#6E5432] uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  {!isCustomCategory ? (
                    <div className="space-y-1.5">
                      <select
                        value={formCategory}
                        onChange={(e) => {
                          if (e.target.value === "__NEW__") {
                            setIsCustomCategory(true);
                          } else {
                            setFormCategory(e.target.value);
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E9DDC5] bg-[#FBF8F1] text-sm text-[#3F3424] focus:outline-none focus:ring-2 focus:ring-[#A17D49]"
                      >
                        {categories
                          .filter((c) => c !== "All")
                          .map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        <option value="__NEW__">+ Add New Category...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Enter new category"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E9DDC5] bg-[#FBF8F1] text-sm text-[#3F3424] focus:outline-none focus:ring-2 focus:ring-[#A17D49]"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomCategory(false)}
                        className="p-2.5 rounded-xl border border-[#E9DDC5] hover:bg-[#F4E8D0] text-xs text-[#6E5432] cursor-pointer"
                        title="Back to dropdown"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-[#6E5432] uppercase tracking-wider mb-1.5">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="180"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#E9DDC5] bg-[#FBF8F1] text-sm text-[#3F3424] focus:outline-none focus:ring-2 focus:ring-[#A17D49]"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#6E5432] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description of ingredients, benefits, or flavor..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9DDC5] bg-[#FBF8F1] text-sm text-[#3F3424] focus:outline-none focus:ring-2 focus:ring-[#A17D49]"
                />
              </div>

              {/* Product Image Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#6E5432] uppercase tracking-wider">
                    Product Image
                  </label>
                  <div className="flex items-center gap-1 bg-[#F4E8D0] p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setImageUploadType("file")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        imageUploadType === "file" ? "bg-white font-semibold shadow-xs text-[#3F3424]" : "text-[#6E5432]"
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadType("url")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        imageUploadType === "url" ? "bg-white font-semibold shadow-xs text-[#3F3424]" : "text-[#6E5432]"
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {imageUploadType === "file" ? (
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#E9DDC5] hover:border-[#A17D49] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-[#FBF8F1]"
                    >
                      {isUploading ? (
                        <div className="py-2 flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 text-[#A17D49] animate-spin" />
                          <span className="text-xs text-[#6E5432]">Uploading image...</span>
                        </div>
                      ) : (
                        <div className="py-2 flex flex-col items-center gap-1.5">
                          <Upload className="w-6 h-6 text-[#A17D49]" />
                          <p className="text-xs font-medium text-[#3F3424]">
                            Click to upload an image from your computer
                          </p>
                          <p className="text-[10px] text-neutral-400">PNG, JPG, WEBP up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E9DDC5] bg-[#FBF8F1] text-sm text-[#3F3424] focus:outline-none focus:ring-2 focus:ring-[#A17D49]"
                    />
                  </div>
                )}

                {/* Live Image Preview */}
                {formImage && (
                  <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl bg-[#F8F1D8]/60 border border-[#E9DDC5]">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-[#E9DDC5]">
                      <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#3F3424] truncate">{formImage}</p>
                      <button
                        type="button"
                        onClick={() => setFormImage("")}
                        className="text-[11px] text-red-600 hover:underline mt-0.5 cursor-pointer"
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* In Stock Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formInStock}
                    onChange={(e) => setFormInStock(e.target.checked)}
                    className="w-4 h-4 rounded text-[#A17D49] focus:ring-[#A17D49] accent-[#A17D49]"
                  />
                  <span className="text-xs font-semibold text-[#6E5432]">Product is in stock & available for purchase</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-[#E9DDC5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E9DDC5] text-xs font-semibold text-[#6E5432] hover:bg-[#F4E8D0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-6 py-2.5 rounded-xl bg-[#A17D49] hover:bg-[#8C6936] text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : editingProduct ? (
                    "Update Product"
                  ) : (
                    "Add Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

