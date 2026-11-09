"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Package,
  Eye,
  EyeOff,
  Search,
  X,
} from "lucide-react";
import { fetchFromBackend, BACKEND_URL, getAdminToken } from "@/lib/api";

interface ComboOffer {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  originalPrice: number;
  offerPrice: number;
  savings: string;
  tag: string;
  image: string;
  items: string[];
  isActive: boolean;
}

export default function AdminCombosPage() {
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboOffer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [savings, setSavings] = useState("");
  const [tag, setTag] = useState("");
  const [image, setImage] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadCombos = () => {
    setIsLoading(true);
    fetchFromBackend("/api/admin/combos")
      .then((res) => {
        if (res.ok && res.data?.combos) {
          setCombos(res.data.combos);
        }
      })
      .catch((err) => console.error("Failed to load combos:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCombos();
  }, []);

  const openCreateModal = () => {
    setEditingCombo(null);
    setName("");
    setSubtitle("");
    setDescription("");
    setOriginalPrice("");
    setOfferPrice("");
    setSavings("");
    setTag("SPECIAL OFFER");
    setImage("https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1080&auto=format&fit=crop");
    setItemsText("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (c: ComboOffer) => {
    setEditingCombo(c);
    setName(c.name);
    setSubtitle(c.subtitle || "");
    setDescription(c.description || "");
    setOriginalPrice(c.originalPrice ? c.originalPrice.toString() : "");
    setOfferPrice(c.offerPrice ? c.offerPrice.toString() : "");
    setSavings(c.savings || "");
    setTag(c.tag || "");
    setImage(c.image || "");
    setItemsText(Array.isArray(c.items) ? c.items.join("\n") : "");
    setIsActive(c.isActive);
    setIsModalOpen(true);
  };

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
        setImage(data.url);
      }
    } catch {
      console.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setFeedback(null);

    const items = itemsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      originalPrice: Number(originalPrice) || 0,
      offerPrice: Number(offerPrice) || Number(originalPrice) || 0,
      savings: savings.trim(),
      tag: tag.trim(),
      image: image.trim(),
      items,
      isActive,
    };

    try {
      const url = editingCombo
        ? `/api/admin/combos/${editingCombo.id}`
        : "/api/admin/combos";
      const method = editingCombo ? "PUT" : "POST";

      const res = await fetchFromBackend(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok && res.data.success) {
        setFeedback({
          message: editingCombo ? "Combo offer updated successfully!" : "New combo offer created!",
          type: "success",
        });
        setIsModalOpen(false);
        loadCombos();
      } else {
        setFeedback({ message: res.data.error || "Failed to save combo offer", type: "error" });
      }
    } catch {
      setFeedback({ message: "Network error saving combo offer", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetchFromBackend(`/api/admin/combos/${id}`, {
        method: "DELETE",
      });
      if (res.ok && res.data.success) {
        setFeedback({ message: "Combo offer deleted successfully", type: "success" });
        setCombos((prev) => prev.filter((c) => c.id !== id));
      } else {
        setFeedback({ message: res.data.error || "Failed to delete combo offer", type: "error" });
      }
    } catch {
      setFeedback({ message: "Network error deleting combo offer", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (c: ComboOffer) => {
    const newStatus = !c.isActive;
    try {
      const res = await fetchFromBackend(`/api/admin/combos/${c.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        setCombos((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, isActive: newStatus } : item))
        );
      }
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const filteredCombos = combos.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.tag && c.tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#6E5432] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#B8945F]" />
            <span>Combo Offers Management</span>
          </h1>
          <p className="text-xs font-sans text-[#A17D49] mt-1">
            Create, edit, and organize value combo bundles displayed on the website.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#B8945F] hover:bg-[#A17D49] text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Combo Offer</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search combo offers..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="text-xs font-medium text-stone-500 flex items-center gap-4">
          <span>Total Combos: <strong>{combos.length}</strong></span>
          <span>Active: <strong>{combos.filter((c) => c.isActive).length}</strong></span>
        </div>
      </div>

      {/* Combos Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
          <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin mb-3"></div>
          <p className="text-xs">Loading combo offers...</p>
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200/80 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-heading text-lg font-bold text-stone-700">No Combo Offers Found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {searchQuery
              ? "No combo offers matched your search criteria."
              : "Get started by creating your first promotional combo package for customers."}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B8945F] hover:bg-[#A17D49] text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Combo</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCombos.map((combo) => (
            <div
              key={combo.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                combo.isActive ? "border-stone-200" : "border-stone-200 opacity-60 bg-stone-50"
              }`}
            >
              <div>
                {/* Image & Badges */}
                <div className="relative h-48 bg-stone-100 overflow-hidden">
                  <img
                    src={combo.image}
                    alt={combo.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1080&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {combo.tag && (
                      <span className="bg-[#B8945F] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                        {combo.tag}
                      </span>
                    )}
                    {combo.savings && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                        {combo.savings}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleActive(combo)}
                    className={`absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-sm transition ${
                      combo.isActive
                        ? "bg-white/90 text-emerald-700 hover:bg-white"
                        : "bg-stone-800 text-stone-200"
                    }`}
                  >
                    {combo.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{combo.isActive ? "Active" : "Inactive"}</span>
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[11px] font-button text-[#B8945F] uppercase tracking-wider font-semibold">
                      {combo.subtitle || "Combo Package"}
                    </span>
                    <h3 className="font-heading font-bold text-stone-900 text-base leading-snug mt-0.5">
                      {combo.name}
                    </h3>
                  </div>

                  {combo.description && (
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {combo.description}
                    </p>
                  )}

                  {/* Included Items */}
                  {combo.items && combo.items.length > 0 && (
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                        Includes ({combo.items.length} items):
                      </p>
                      <ul className="text-xs text-stone-700 space-y-0.5">
                        {combo.items.slice(0, 3).map((it, idx) => (
                          <li key={idx} className="truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B8945F]"></span>
                            <span>{it}</span>
                          </li>
                        ))}
                        {combo.items.length > 3 && (
                          <li className="text-[11px] text-[#A17D49] font-medium">
                            +{combo.items.length - 3} more products...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Price */}
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-stone-900">₹{combo.offerPrice}</span>
                    {combo.originalPrice > combo.offerPrice && (
                      <span className="text-xs text-stone-400 line-through">
                        ₹{combo.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
                <button
                  onClick={() => openEditModal(combo)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-200/80 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => setDeletingId(combo.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-heading font-bold text-stone-900 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#B8945F]" />
                <span>{editingCombo ? "Edit Combo Offer" : "Add New Combo Offer"}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Name & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Combo Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ultimate Pasta Delight Bundle"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Subtitle / Variety Note
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. 7 Premium Pasta Varieties"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Promotional Tag
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="e.g. POPULAR, BEST SELLER, NEW"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="1400"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Offer Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="1120"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Savings Badge
                  </label>
                  <input
                    type="text"
                    value={savings}
                    onChange={(e) => setSavings(e.target.value)}
                    placeholder="e.g. 20% OFF (auto-computed if blank)"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Image URL & Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Combo Image URL *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://... or upload below"
                    className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                {isUploading && <p className="text-xs text-amber-600 mt-1 animate-pulse">Uploading image...</p>}
                {image && (
                  <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-stone-200">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of this combo package..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Items List */}
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Included Products / Items (One per line)
                </label>
                <textarea
                  rows={4}
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  placeholder="Moringa Pasta Penne&#10;Beetroot Pasta Penne&#10;Little Grain Pasta Penne"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Type each included item on a new line. They will be displayed as bullet points.
                </p>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-3 text-xs font-semibold text-stone-700">
                    Visible & Purchasable on Website
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#B8945F] hover:bg-[#A17D49] text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? "Saving..." : editingCombo ? "Update Combo Offer" : "Create Combo Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <h3 className="font-heading font-bold text-stone-900 text-base">Delete Combo Offer?</h3>
            <p className="text-xs text-stone-500">
              Are you sure you want to permanently delete this combo offer? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
