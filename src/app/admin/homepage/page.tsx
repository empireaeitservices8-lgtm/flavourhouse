"use client";

import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  Upload,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { fetchFromBackend, BACKEND_URL, getAdminToken } from "@/lib/api";

export default function AdminHomepageSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Active section tab
  const [activeTab, setActiveTab] = useState<"hero" | "story" | "millets" | "banner">("hero");

  // Hero Section
  const [heroImage, setHeroImage] = useState("");
  const [heroBadge, setHeroBadge] = useState("");
  const [heroTitlePart1, setHeroTitlePart1] = useState("");
  const [heroTitlePart2, setHeroTitlePart2] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [heroButton1Text, setHeroButton1Text] = useState("");
  const [heroButton1Link, setHeroButton1Link] = useState("");
  const [heroButton2Text, setHeroButton2Text] = useState("");
  const [heroButton2Link, setHeroButton2Link] = useState("");
  const [heroFloatingTitle, setHeroFloatingTitle] = useState("");
  const [heroFloatingSubtitle, setHeroFloatingSubtitle] = useState("");

  // Story Section
  const [storyImage, setStoryImage] = useState("");
  const [storyBadge, setStoryBadge] = useState("");
  const [storyTitlePart1, setStoryTitlePart1] = useState("");
  const [storyTitlePart2, setStoryTitlePart2] = useState("");
  const [storyParagraph1, setStoryParagraph1] = useState("");
  const [storyParagraph2, setStoryParagraph2] = useState("");

  // Why Millets Section
  const [whyMilletsImage, setWhyMilletsImage] = useState("");
  const [whyMilletsTitle, setWhyMilletsTitle] = useState("");
  const [whyMilletsSubtitle, setWhyMilletsSubtitle] = useState("");

  // Promotional Banner
  const [banner1Image, setBanner1Image] = useState("");
  const [banner1Title, setBanner1Title] = useState("");
  const [banner1Link, setBanner1Link] = useState("");

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    fetchFromBackend("/api/admin/homepage").then((res) => {
      if (res.ok && res.data?.settings) {
        const s = res.data.settings;
        setHeroImage(s.heroImage || "");
        setHeroBadge(s.heroBadge || "Premium Organic Food");
        setHeroTitlePart1(s.heroTitlePart1 || "Rooted in Health.");
        setHeroTitlePart2(s.heroTitlePart2 || "Rich in Flavour.");
        setHeroDescription(s.heroDescription || "");
        setHeroButton1Text(s.heroButton1Text || "Shop Products");
        setHeroButton1Link(s.heroButton1Link || "/products");
        setHeroButton2Text(s.heroButton2Text || "Explore Categories");
        setHeroButton2Link(s.heroButton2Link || "/products");
        setHeroFloatingTitle(s.heroFloatingTitle || "100% Natural");
        setHeroFloatingSubtitle(s.heroFloatingSubtitle || "Pure Nutrition");

        setStoryImage(s.storyImage || "");
        setStoryBadge(s.storyBadge || "Our Roots");
        setStoryTitlePart1(s.storyTitlePart1 || "Rooted in Health.");
        setStoryTitlePart2(s.storyTitlePart2 || "Rich in Flavour.");
        setStoryParagraph1(s.storyParagraph1 || "");
        setStoryParagraph2(s.storyParagraph2 || "");

        setWhyMilletsImage(s.whyMilletsImage || "");
        setWhyMilletsTitle(s.whyMilletsTitle || "100%");
        setWhyMilletsSubtitle(s.whyMilletsSubtitle || "Pure Organic Ingredients");

        setBanner1Image(s.banner1Image || "");
        setBanner1Title(s.banner1Title || "");
        setBanner1Link(s.banner1Link || "");
      }
      setIsLoading(false);
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
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
        if (fieldName === "heroImage") setHeroImage(data.url);
        if (fieldName === "storyImage") setStoryImage(data.url);
        if (fieldName === "whyMilletsImage") setWhyMilletsImage(data.url);
        if (fieldName === "banner1Image") setBanner1Image(data.url);
      }
    } catch {
      console.error("Upload failed");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const payload = {
      heroImage,
      heroBadge,
      heroTitlePart1,
      heroTitlePart2,
      heroDescription,
      heroButton1Text,
      heroButton1Link,
      heroButton2Text,
      heroButton2Link,
      heroFloatingTitle,
      heroFloatingSubtitle,
      storyImage,
      storyBadge,
      storyTitlePart1,
      storyTitlePart2,
      storyParagraph1,
      storyParagraph2,
      whyMilletsImage,
      whyMilletsTitle,
      whyMilletsSubtitle,
      banner1Image,
      banner1Title,
      banner1Link,
    };

    try {
      const res = await fetchFromBackend("/api/admin/homepage", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res.ok && res.data?.success) {
        setFeedback({ message: "Homepage images & content updated successfully!", type: "success" });
      } else {
        setFeedback({ message: res.data?.error || "Failed to update homepage content.", type: "error" });
      }
    } catch {
      setFeedback({ message: "Network error saving homepage configuration.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-stone-400">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs">Loading homepage visual settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#6E5432] flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#B8945F]" />
            <span>Homepage Images & Banners</span>
          </h1>
          <p className="text-xs font-sans text-[#A17D49] mt-1">
            Customize the main hero banner, story photos, Why Millets images, and promotional visuals.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition border border-stone-200 shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#B8945F]" />
          <span>Preview Live Homepage</span>
        </a>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("hero")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === "hero"
              ? "bg-[#B8945F] text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
          }`}
        >
          1. Hero Section & Main Image
        </button>
        <button
          onClick={() => setActiveTab("story")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === "story"
              ? "bg-[#B8945F] text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
          }`}
        >
          2. Brand Story Image & Text
        </button>
        <button
          onClick={() => setActiveTab("millets")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === "millets"
              ? "bg-[#B8945F] text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
          }`}
        >
          3. Why Millets Arch Image
        </button>
        <button
          onClick={() => setActiveTab("banner")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === "banner"
              ? "bg-[#B8945F] text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
          }`}
        >
          4. Promotional Banner
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: HERO SECTION */}
        {activeTab === "hero" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
            <h2 className="font-heading font-bold text-stone-900 text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <span>Main Hero Banner & Image</span>
            </h2>

            {/* Hero Image Preview & URL */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider">
                Hero Image (Main Visual on Right) *
              </label>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {heroImage ? (
                  <div className="w-full sm:w-64 h-44 rounded-2xl overflow-hidden border border-stone-200 shadow-xs relative bg-stone-100 shrink-0">
                    <img src={heroImage} alt="Hero banner" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full sm:w-64 h-44 rounded-2xl border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 bg-stone-50 shrink-0">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                  </div>
                )}

                <div className="flex-1 space-y-3 w-full">
                  <input
                    type="text"
                    value={heroImage}
                    onChange={(e) => setHeroImage(e.target.value)}
                    placeholder="https://images.unsplash.com/... or upload image"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />

                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer transition border border-stone-200">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Hero Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "heroImage")}
                        className="hidden"
                      />
                    </label>
                    {uploadingField === "heroImage" && (
                      <span className="text-xs text-amber-600 animate-pulse font-medium">Uploading...</span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Recommended resolution: 1200x800px or higher. High-resolution food/millet bowl images work best.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-stone-100">
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Top Pill Badge
                </label>
                <input
                  type="text"
                  value={heroBadge}
                  onChange={(e) => setHeroBadge(e.target.value)}
                  placeholder="Premium Organic Food"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Headline Part 1 (Black font)
                </label>
                <input
                  type="text"
                  value={heroTitlePart1}
                  onChange={(e) => setHeroTitlePart1(e.target.value)}
                  placeholder="Rooted in Health."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Headline Part 2 (Golden italic)
                </label>
                <input
                  type="text"
                  value={heroTitlePart2}
                  onChange={(e) => setHeroTitlePart2(e.target.value)}
                  placeholder="Rich in Flavour."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Hero Paragraph Description
                </label>
                <textarea
                  rows={2}
                  value={heroDescription}
                  onChange={(e) => setHeroDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>


            </div>
          </div>
        )}

        {/* TAB 2: STORY SECTION */}
        {activeTab === "story" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
            <h2 className="font-heading font-bold text-stone-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Brand Story Section</span>
            </h2>

            {/* Story Image */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider">
                Story Image (Left Side) *
              </label>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {storyImage ? (
                  <div className="w-full sm:w-64 h-44 rounded-2xl overflow-hidden border border-stone-200 shadow-xs relative bg-stone-100 shrink-0">
                    <img src={storyImage} alt="Story visual" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full sm:w-64 h-44 rounded-2xl border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 bg-stone-50 shrink-0">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                  </div>
                )}

                <div className="flex-1 space-y-3 w-full">
                  <input
                    type="text"
                    value={storyImage}
                    onChange={(e) => setStoryImage(e.target.value)}
                    placeholder="https://... or upload image"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />

                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer transition border border-stone-200">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Story Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "storyImage")}
                        className="hidden"
                      />
                    </label>
                    {uploadingField === "storyImage" && (
                      <span className="text-xs text-amber-600 animate-pulse font-medium">Uploading...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-stone-100">
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Story Badge
                </label>
                <input
                  type="text"
                  value={storyBadge}
                  onChange={(e) => setStoryBadge(e.target.value)}
                  placeholder="Our Roots"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Story Title Part 1
                </label>
                <input
                  type="text"
                  value={storyTitlePart1}
                  onChange={(e) => setStoryTitlePart1(e.target.value)}
                  placeholder="Rooted in Health."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Story Paragraph 1
                </label>
                <textarea
                  rows={3}
                  value={storyParagraph1}
                  onChange={(e) => setStoryParagraph1(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Story Paragraph 2
                </label>
                <textarea
                  rows={3}
                  value={storyParagraph2}
                  onChange={(e) => setStoryParagraph2(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WHY MILLETS */}
        {activeTab === "millets" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
            <h2 className="font-heading font-bold text-stone-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Why Millets / Nutrition Section Image</span>
            </h2>

            {/* Why Millets Image */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider">
                Arched Grain Visual Image *
              </label>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {whyMilletsImage ? (
                  <div className="w-full sm:w-48 h-60 rounded-t-full rounded-b-2xl overflow-hidden border border-stone-200 shadow-xs relative bg-stone-100 shrink-0">
                    <img src={whyMilletsImage} alt="Why millets arch" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full sm:w-48 h-60 rounded-t-full rounded-b-2xl border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 bg-stone-50 shrink-0">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                  </div>
                )}

                <div className="flex-1 space-y-3 w-full">
                  <input
                    type="text"
                    value={whyMilletsImage}
                    onChange={(e) => setWhyMilletsImage(e.target.value)}
                    placeholder="https://... or upload image"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />

                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer transition border border-stone-200">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Millets Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "whyMilletsImage")}
                        className="hidden"
                      />
                    </label>
                    {uploadingField === "whyMilletsImage" && (
                      <span className="text-xs text-amber-600 animate-pulse font-medium">Uploading...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-stone-100">
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Floating Stat Number / Title
                </label>
                <input
                  type="text"
                  value={whyMilletsTitle}
                  onChange={(e) => setWhyMilletsTitle(e.target.value)}
                  placeholder="100%"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Floating Stat Subtitle
                </label>
                <input
                  type="text"
                  value={whyMilletsSubtitle}
                  onChange={(e) => setWhyMilletsSubtitle(e.target.value)}
                  placeholder="Pure Organic Ingredients"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BANNER */}
        {activeTab === "banner" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
            <h2 className="font-heading font-bold text-stone-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Promotional Strip / Special Offer Banner</span>
            </h2>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider">
                Banner Image
              </label>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {banner1Image ? (
                  <div className="w-full sm:w-64 h-32 rounded-2xl overflow-hidden border border-stone-200 shadow-xs relative bg-stone-100 shrink-0">
                    <img src={banner1Image} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full sm:w-64 h-32 rounded-2xl border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 bg-stone-50 shrink-0">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                  </div>
                )}

                <div className="flex-1 space-y-3 w-full">
                  <input
                    type="text"
                    value={banner1Image}
                    onChange={(e) => setBanner1Image(e.target.value)}
                    placeholder="https://... or upload image"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />

                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer transition border border-stone-200">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Banner</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "banner1Image")}
                        className="hidden"
                      />
                    </label>
                    {uploadingField === "banner1Image" && (
                      <span className="text-xs text-amber-600 animate-pulse font-medium">Uploading...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-stone-100">
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Banner Title / Caption
                </label>
                <input
                  type="text"
                  value={banner1Title}
                  onChange={(e) => setBanner1Title(e.target.value)}
                  placeholder="Special Weekend Discount"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-600 tracking-wider mb-1.5">
                  Target Destination Link
                </label>
                <input
                  type="text"
                  value={banner1Link}
                  onChange={(e) => setBanner1Link(e.target.value)}
                  placeholder="/products or /combo-offers"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-[#B8945F] hover:bg-[#A17D49] text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving Changes..." : "Save Homepage Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

