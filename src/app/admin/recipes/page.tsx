"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Clock,
  ChefHat,
  Utensils,
  Search,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { fetchFromBackend, BACKEND_URL, getAdminToken } from "@/lib/api";

interface Recipe {
  id: number;
  title: string;
  category: string;
  prepTime: string;
  cookTime: string;
  difficulty: string;
  servings: string;
  image: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  isActive: boolean;
}

const CATEGORIES = ["Pasta", "Noodles", "Vermicelli", "Cookies", "Beverages", "Snacks", "General"];
const DIFFICULTIES = ["Easy", "Super Easy", "Medium", "Hard"];

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Pasta");
  const [prepTime, setPrepTime] = useState("15 mins");
  const [cookTime, setCookTime] = useState("12 mins");
  const [difficulty, setDifficulty] = useState("Easy");
  const [servings, setServings] = useState("2-3");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Delete Confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadRecipes = () => {
    setIsLoading(true);
    fetchFromBackend("/api/admin/recipes")
      .then((res) => {
        if (res.ok && res.data?.recipes) {
          setRecipes(res.data.recipes);
        }
      })
      .catch((err) => console.error("Failed to load recipes:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const openCreateModal = () => {
    setEditingRecipe(null);
    setTitle("");
    setCategory("Pasta");
    setPrepTime("15 mins");
    setCookTime("12 mins");
    setDifficulty("Easy");
    setServings("2-3");
    setImage("/images/pasta.png");
    setDescription("");
    setIngredientsText("");
    setInstructionsText("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (r: Recipe) => {
    setEditingRecipe(r);
    setTitle(r.title);
    setCategory(r.category || "Pasta");
    setPrepTime(r.prepTime || "15 mins");
    setCookTime(r.cookTime || "12 mins");
    setDifficulty(r.difficulty || "Easy");
    setServings(r.servings || "2-3");
    setImage(r.image || "");
    setDescription(r.description || "");
    setIngredientsText(Array.isArray(r.ingredients) ? r.ingredients.join("\n") : "");
    setInstructionsText(Array.isArray(r.instructions) ? r.instructions.join("\n") : "");
    setIsActive(r.isActive);
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
    if (!title.trim()) return;

    setIsSaving(true);
    setFeedback(null);

    const ingredients = ingredientsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const instructions = instructionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      category: category.trim(),
      prepTime: prepTime.trim(),
      cookTime: cookTime.trim(),
      difficulty: difficulty.trim(),
      servings: servings.trim(),
      image: image.trim(),
      description: description.trim(),
      ingredients,
      instructions,
      isActive,
    };

    try {
      const url = editingRecipe
        ? `/api/admin/recipes/${editingRecipe.id}`
        : "/api/admin/recipes";
      const method = editingRecipe ? "PUT" : "POST";

      const res = await fetchFromBackend(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok && res.data.success) {
        setFeedback({
          message: editingRecipe ? "Recipe updated successfully!" : "New recipe added successfully!",
          type: "success",
        });
        setIsModalOpen(false);
        loadRecipes();
      } else {
        setFeedback({ message: res.data.error || "Failed to save recipe", type: "error" });
      }
    } catch {
      setFeedback({ message: "Network error saving recipe", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetchFromBackend(`/api/admin/recipes/${id}`, {
        method: "DELETE",
      });
      if (res.ok && res.data.success) {
        setFeedback({ message: "Recipe deleted successfully", type: "success" });
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      } else {
        setFeedback({ message: res.data.error || "Failed to delete recipe", type: "error" });
      }
    } catch {
      setFeedback({ message: "Network error deleting recipe", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (r: Recipe) => {
    const newStatus = !r.isActive;
    try {
      const res = await fetchFromBackend(`/api/admin/recipes/${r.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        setRecipes((prev) =>
          prev.map((item) => (item.id === r.id ? { ...item, isActive: newStatus } : item))
        );
      }
    } catch (err) {
      console.error("Toggle recipe failed:", err);
    }
  };

  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#6E5432] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#B8945F]" />
            <span>Recipe Management</span>
          </h1>
          <p className="text-xs font-sans text-[#A17D49] mt-1">
            Create, manage, and feature wholesome recipes for customers on the Recipes page.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#B8945F] hover:bg-[#A17D49] text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Recipe</span>
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setCategoryFilter("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                categoryFilter === "All"
                  ? "bg-[#B8945F] text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All
            </button>
            {CATEGORIES.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  categoryFilter === cat
                    ? "bg-[#B8945F] text-white shadow-xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-medium text-stone-500 shrink-0">
          Showing <strong>{filteredRecipes.length}</strong> of {recipes.length} recipes
        </div>
      </div>

      {/* Recipes Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
          <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin mb-3"></div>
          <p className="text-xs">Loading recipes...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200/80 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-heading text-lg font-bold text-stone-700">No Recipes Found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {searchQuery
              ? "No recipes matched your search filter."
              : "Inspire your customers with tasty, wholesome recipes using your products."}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B8945F] hover:bg-[#A17D49] text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Recipe</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                recipe.isActive ? "border-stone-200" : "border-stone-200 opacity-60 bg-stone-50"
              }`}
            >
              <div>
                {/* Image */}
                <div className="relative h-48 bg-stone-100 overflow-hidden">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/pasta.png";
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#B8945F] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                      {recipe.category}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleActive(recipe)}
                    className={`absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-sm transition ${
                      recipe.isActive
                        ? "bg-white/90 text-emerald-700 hover:bg-white"
                        : "bg-stone-800 text-stone-200"
                    }`}
                  >
                    {recipe.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{recipe.isActive ? "Published" : "Draft"}</span>
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#B8945F]" />
                      <span>{recipe.cookTime}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ChefHat className="w-3.5 h-3.5 text-[#B8945F]" />
                      <span>{recipe.difficulty}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-[#B8945F]" />
                      <span>{recipe.servings}</span>
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-stone-900 text-base leading-snug">
                    {recipe.title}
                  </h3>

                  {recipe.description && (
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {recipe.description}
                    </p>
                  )}

                  {/* Ingredients Preview */}
                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs text-stone-600">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                        Ingredients ({recipe.ingredients.length}):
                      </p>
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-stone-600">
                        {recipe.ingredients.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
                <button
                  onClick={() => openEditModal(recipe)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-200/80 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => setDeletingId(recipe.id)}
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
                <BookOpen className="w-5 h-5 text-[#B8945F]" />
                <span>{editingRecipe ? "Edit Recipe" : "Add New Recipe"}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Recipe Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Creamy Moringa Penne Pasta"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Timing & Servings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Prep Time
                  </label>
                  <input
                    type="text"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="e.g. 15 mins"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Cook Time
                  </label>
                  <input
                    type="text"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    placeholder="e.g. 12 mins"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                    Servings
                  </label>
                  <input
                    type="text"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    placeholder="e.g. 2-3"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Image URL & Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Recipe Image URL *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="/images/pasta.png or https://..."
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
                  placeholder="Short appetizing summary of this recipe..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Ingredients (One per line)
                </label>
                <textarea
                  rows={4}
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  placeholder="200g Moringa Pasta Penne&#10;2 tbsp olive oil&#10;3 cloves garlic, minced&#10;Cherry tomatoes"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Instructions / Steps (One per line)
                </label>
                <textarea
                  rows={4}
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  placeholder="Boil penne in salted water for 7-8 minutes.&#10;Heat olive oil in a skillet and sauté minced garlic.&#10;Toss in cooked penne and garnish with basil."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:outline-none focus:border-amber-500"
                />
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
                    Publish Recipe on Website
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
                  {isSaving ? "Saving..." : editingRecipe ? "Update Recipe" : "Publish Recipe"}
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
            <h3 className="font-heading font-bold text-stone-900 text-base">Delete Recipe?</h3>
            <p className="text-xs text-stone-500">
              Are you sure you want to permanently delete this recipe? It will no longer appear on the website.
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
