"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { BACKEND_URL } from "@/lib/api";

function ProductsPageInner() {
  const { addToCart } = useCart();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [activeCategory, setActiveCategory] = useState<string>(
    searchParams.get("category") || "All"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [addedId, setAddedId] = useState<number | null>(null);

  // Sync activeCategory when the URL ?category= param changes
  useEffect(() => {
    const cat = searchParams.get("category");
    setActiveCategory(cat || "All");
  }, [searchParams]);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
        ]);

        let loadedProducts: any[] = [];
        let loadedCategories: string[] = ["Pasta", "Vermicelli", "Noodles", "Cookies"];

        if (prodRes.ok) {
          const data = await prodRes.json();
          if (Array.isArray(data)) {
            loadedProducts = data;
          }
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData) && catData.length > 0) {
            loadedCategories = catData.map((c: any) => c.name || c);
          }
        }

        if (loadedProducts.length > 0) {
          setProducts(loadedProducts);

          // Merge loaded category names with any unique categories found in products
          const productCats = loadedProducts.map((p: any) => p.category).filter(Boolean);
          const allUniqueCats = Array.from(new Set([...loadedCategories, ...productCats]));
          setCategories(["All", ...allUniqueCats]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Products/Categories fetch failed, trying direct backend...", err);
      }

      // Fallback: Direct backend fetch
      try {
        const directRes = await fetch(`${BACKEND_URL}/api/products`, { cache: "no-store" });
        if (directRes.ok) {
          const directData = await directRes.json();
          if (Array.isArray(directData)) {
            setProducts(directData);
            const cats = [
              "All",
              ...Array.from(new Set<string>(directData.map((p: any) => p.category).filter(Boolean))),
            ];
            setCategories(cats);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Direct backend products fetch failed:", err);
      }

      setLoading(false);
    }

    loadProducts();
  }, []);

  const handleQuickAdd = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  // Robust category and search matching
  const filteredProducts = products.filter((product) => {
    const keyword = activeCategory.toLowerCase();
    const prodCat = (product.category || "").toLowerCase();

    // Matches if All, exact category, or bidirectional substring inclusion
    const matchesCategory =
      activeCategory === "All" ||
      prodCat === keyword ||
      prodCat.includes(keyword) ||
      keyword.includes(prodCat) ||
      (keyword.includes("pasta") && (prodCat.includes("macaroni") || prodCat.includes("pasta"))) ||
      (keyword.includes("noodle") && prodCat.includes("noodle")) ||
      (keyword.includes("cookie") && prodCat.includes("cookie")) ||
      (keyword.includes("vermicelli") && prodCat.includes("vermicelli"));

    const matchesSearch =
      !searchQuery.trim() ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const displayLabel = activeCategory === "All" ? "All Products" : activeCategory;

  // Is a category pill active given current activeCategory?
  const isPillActive = (cat: string) => {
    if (cat === "All") return activeCategory === "All";
    if (activeCategory === "All") return false;
    const catLower = cat.toLowerCase();
    const activeLower = activeCategory.toLowerCase();
    return (
      catLower === activeLower ||
      catLower.includes(activeLower) ||
      activeLower.includes(catLower)
    );
  };

  // Unique actual categories in the filtered list
  const filteredActualCategories = Array.from(
    new Set(filteredProducts.map((p) => p.category).filter(Boolean))
  );

  const ProductCard = ({ product }: { product: any }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      key={product.id}
      className="group"
    >
      <Link
        href={`/products/${product.id}`}
        className="block relative aspect-[4/5] bg-brand-sand rounded-3xl overflow-hidden mb-5 border border-brand-border/60 shadow-xs"
      >
        <img
          src={product.image || "/images/pasta.png"}
          alt={product.name}
          className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <button
            onClick={(e) => handleQuickAdd(product, e)}
            className={`font-button uppercase tracking-wider text-xs px-6 py-3 rounded-full flex items-center gap-2 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl cursor-pointer ${
              addedId === product.id
                ? "bg-green-600 text-white"
                : "bg-white text-brand-dark hover:bg-brand-primary hover:text-white"
            }`}
          >
            {addedId === product.id ? (
              <><Check className="w-4 h-4" /> Added!</>
            ) : (
              <><ShoppingBag className="w-4 h-4" /> Quick Add</>
            )}
          </button>
        </div>
      </Link>
      <div className="px-2">
        <p className="text-brand-text/60 font-sans text-xs uppercase tracking-widest mb-1">
          {product.category}
        </p>
        <Link href={`/products/${product.id}`}>
          <h3 className="font-heading font-bold text-brand-dark text-lg leading-snug mb-2 group-hover:text-brand-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <p className="font-button font-bold text-brand-dark">₹{product.price}</p>
          {product.discountPrice && (
            <p className="font-sans text-xs text-brand-text/50 line-through">
              ₹{product.discountPrice}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-brand-cream border-b border-brand-border">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="font-button text-sm uppercase tracking-widest text-brand-primary mb-3 block">
              100% Natural Ingredients
            </span>
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-brand-dark mb-6">
              Our <span className="italic font-subheading font-normal">Collection</span>
            </h1>
            <p className="font-sans text-brand-text/80 text-lg max-w-2xl mx-auto">
              Explore our premium range of organic food products, rooted in health, rich in flavour, and crafted for modern lifestyles.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="sticky top-[88px] z-40 bg-white/90 backdrop-blur-md border-b border-brand-border py-4">
        <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full font-button text-sm transition-all cursor-pointer ${
                  isPillActive(cat)
                    ? "bg-brand-primary text-white shadow-md font-semibold"
                    : "bg-brand-cream text-brand-dark hover:bg-brand-sand"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64 shrink-0">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-cream border border-brand-border rounded-full pl-12 pr-4 py-2.5 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-brand-dark"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/50" />
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex justify-between items-end mb-8">
            <h2 className="font-heading text-2xl font-bold text-brand-dark">
              {displayLabel}
            </h2>
            <p className="font-sans text-sm text-brand-text/60">
              {loading ? "Loading..." : `${filteredProducts.length} items`}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-sans text-brand-text/60">No products found.</p>
            </div>
          ) : activeCategory === "All" ? (
            // All view: group by category sections
            <div className="flex flex-col gap-16">
              {categories.filter((c) => c !== "All").map((category) => {
                const categoryProducts = filteredProducts.filter(
                  (p) => (p.category || "").trim().toLowerCase() === category.trim().toLowerCase()
                );
                if (categoryProducts.length === 0) return null;
                return (
                  <div key={category} className="category-section">
                    <h3 className="font-heading text-3xl font-bold text-brand-dark mb-8 border-b border-brand-border pb-4">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                      <AnimatePresence>
                        {categoryProducts.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Specific category view
            <div className="flex flex-col gap-16">
              {filteredActualCategories.length > 1 ? (
                filteredActualCategories.map((category) => {
                  const categoryProducts = filteredProducts.filter(
                    (p) => (p.category || "").trim().toLowerCase() === category.trim().toLowerCase()
                  );
                  if (categoryProducts.length === 0) return null;
                  return (
                    <div key={category} className="category-section">
                      <h3 className="font-heading text-2xl font-bold text-brand-dark mb-6 border-b border-brand-border pb-3">
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                        <AnimatePresence>
                          {categoryProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                  <AnimatePresence>
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      }
    >
      <ProductsPageInner />
    </Suspense>
  );
}
