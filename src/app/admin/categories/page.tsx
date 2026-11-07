"use client";

import { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Package,
  Search,
  AlertCircle,
  CheckCircle,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { fetchFromBackend, BACKEND_URL, getAdminToken } from "@/lib/api";

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  image?: string;
  productCount: number;
  createdAt?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete State
  const [deleteCategory, setDeleteCategory] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback Notification
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetchFromBackend("/api/admin/categories");
      if (res.ok && res.data?.categories) {
        setCategories(res.data.categories);
      } else {
        // Fallback to public categories
        const publicRes = await fetch("/api/categories");
        if (publicRes.ok) {
          const pubData = await publicRes.json();
          setCategories(pubData);
        }
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setName("");
    setDescription("");
    setImage("");
    setModalError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setIsEditMode(true);
    setCurrentId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setImage(cat.image || "");
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
        setModalError(data.error || "Failed to upload image.");
      }
    } catch {
      setModalError("Network error while uploading category image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!name.trim()) {
      setModalError("Category name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && currentId) {
        const res = await fetchFromBackend(`/api/admin/categories`, {
          method: "PUT",
          body: JSON.stringify({
            id: currentId,
            name: name.trim(),
            description: description.trim(),
            image: image.trim(),
          }),
        });

        if (res.ok && res.data?.success) {
          showNotification("success", `Category "${name}" updated successfully!`);
          setIsModalOpen(false);
          loadCategories();
        } else {
          setModalError(res.data?.error || "Failed to update category.");
        }
      } else {
        const res = await fetchFromBackend("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            image: image.trim(),
          }),
        });

        if (res.ok && res.data?.success) {
          showNotification("success", `Category "${name}" created successfully!`);
          setIsModalOpen(false);
          loadCategories();
        } else {
          setModalError(res.data?.error || "Failed to create category.");
        }
      }
    } catch {
      setModalError("Failed to communicate with server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    setIsDeleting(true);

    try {
      const res = await fetchFromBackend(`/api/admin/categories?id=${deleteCategory.id}`, {
        method: "DELETE",
      });

      if (res.ok && res.data?.success) {
        showNotification("success", `Category "${deleteCategory.name}" removed.`);
        setDeleteCategory(null);
        loadCategories();
      } else {
        showNotification("error", res.data?.error || "Failed to delete category.");
      }
    } catch {
      showNotification("error", "Network error while deleting category.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-[#B8945F]" />
            <h1 className="text-2xl font-heading font-bold text-[#6E5432]">
              Categories Management
            </h1>
          </div>
          <p className="text-xs font-sans text-[#A17D49] mt-1">
            Organize and manage your product categories. Changes reflect immediately on the live website and product selectors.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B8945F] hover:bg-[#A17D49] text-white text-xs font-button font-medium shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs transition ${
            notification.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9DDC5] shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-xs text-[#3F3424] focus:outline-none focus:border-[#B8945F]"
          />
          <Search className="w-4 h-4 text-[#A17D49] absolute left-3 top-2.5" />
        </div>

        <span className="text-xs font-sans text-[#A17D49]">
          Total Categories: <strong className="text-[#6E5432]">{filteredCategories.length}</strong>
        </span>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#A17D49]">
          <div className="w-8 h-8 border-4 border-[#B8945F]/30 border-t-[#B8945F] rounded-full animate-spin mb-3"></div>
          <p className="text-xs">Loading categories from database...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E9DDC5] p-12 text-center">
          <FolderTree className="w-12 h-12 text-[#B8945F]/40 mx-auto mb-3" />
          <h3 className="text-base font-heading font-semibold text-[#6E5432] mb-1">
            No categories found
          </h3>
          <p className="text-xs text-[#A17D49] max-w-sm mx-auto mb-4">
            {searchQuery ? "No categories matched your search." : "Get started by creating your first product category."}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B8945F] text-white text-xs font-button"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Category</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-[#E9DDC5] p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E9DDC5] flex items-center justify-center text-[#B8945F] overflow-hidden shrink-0">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <FolderTree className="w-6 h-6" />
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-button font-medium px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E9DDC5] text-[#6E5432]">
                    <Package className="w-3 h-3 text-[#B8945F]" />
                    <span>{cat.productCount} {cat.productCount === 1 ? "Product" : "Products"}</span>
                  </span>
                </div>

                <h3 className="font-heading font-bold text-lg text-[#6E5432] group-hover:text-[#B8945F] transition">
                  {cat.name}
                </h3>
                <p className="text-[11px] font-mono text-[#A17D49]/80 mb-2">
                  /{cat.slug}
                </p>
                <p className="text-xs text-[#A17D49] line-clamp-2">
                  {cat.description || "No description provided."}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#FAF7F2] flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(cat)}
                  className="p-2 rounded-lg text-[#6E5432] hover:text-[#B8945F] hover:bg-[#FAF7F2] transition cursor-pointer"
                  title="Edit category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteCategory(cat)}
                  className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E9DDC5] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#E9DDC5] mb-5">
              <h2 className="font-heading font-bold text-lg text-[#6E5432]">
                {isEditMode ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#A17D49] hover:text-[#6E5432] hover:bg-[#FAF7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-button font-semibold uppercase text-[#A17D49] tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pasta, Millet Cookies, Superfoods..."
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-sm text-[#3F3424] focus:outline-none focus:border-[#B8945F] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-button font-semibold uppercase text-[#A17D49] tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Wholesome description of products in this category..."
                  className="w-full px-4 py-2 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-xs text-[#3F3424] focus:outline-none focus:border-[#B8945F] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-button font-semibold uppercase text-[#A17D49] tracking-wider mb-1.5">
                  Category Image / Icon URL
                </label>
                <div className="flex items-center gap-3">
                  {image ? (
                    <img src={image} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-[#E9DDC5]" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E9DDC5] flex items-center justify-center text-[#A17D49]">
                      <ImageIcon className="w-5 h-5 opacity-60" />
                    </div>
                  )}
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://... or upload"
                    className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-xs text-[#3F3424] focus:outline-none focus:border-[#B8945F]"
                  />
                  <label className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E9DDC5] hover:bg-[#F8F1D8] text-[#6E5432] cursor-pointer" title="Upload image">
                    <Upload className="w-4 h-4 text-[#B8945F]" />
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                  </label>
                </div>
                {isUploading && <p className="text-[11px] text-[#B8945F] animate-pulse mt-1">Uploading...</p>}
              </div>

              <div className="pt-4 border-t border-[#E9DDC5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E9DDC5] text-[#6E5432] text-xs font-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#B8945F] hover:bg-[#A17D49] text-white text-xs font-button font-medium shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-red-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <h3 className="font-heading font-bold text-lg text-red-700 mb-2">
              Delete Category?
            </h3>
            <p className="text-xs text-[#3F3424] mb-4">
              Are you sure you want to delete <strong>{deleteCategory.name}</strong>?
              {deleteCategory.productCount > 0 && (
                <span className="block mt-2 text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  ⚠️ Note: {deleteCategory.productCount} product(s) currently belong to this category. Their category will be set to unassigned.
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteCategory(null)}
                className="px-4 py-2 rounded-xl border border-[#E9DDC5] text-[#6E5432] text-xs font-button"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-button font-medium shadow transition cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

