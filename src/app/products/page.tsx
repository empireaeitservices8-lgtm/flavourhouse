"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useCart } from "@/context/CartContext";

// Maps URL keyword → friendly display name
const KEYWORD_MAP: Record<string, string> = {
  Pasta: "Millet Pasta",
  Noodles: "Millet Noodles",
  Vermicelli: "Millet Vermicelli",
  Cookies: "Millet Cookies",
};

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
    fetch("/api/products/", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        const uniqueCategories = [
          "All",
          ...Array.from(new Set<string>(data.map((p: any) => p.category))),
        ];
        setCategories(uniqueCategories);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });
  }, []);

  const handleQuickAdd = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  // keyword-based matching: ?category=Pasta matches 'Millet Pasta', 'Specialty Pasta', 'Macaroni', etc.
  const filteredProducts = products.filter((product) => {
    const keyword = activeCategory.toLowerCase();
    const matchesCategory =
      activeCategory === "All" ||
      product.category.toLowerCase().includes(keyword) ||
      (keyword === "pasta" && product.category.toLowerCase().includes("macaroni"));
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Display label for the heading
  const displayLabel =
    activeCategory === "All"
      ? "All Products"
      : KEYWORD_MAP[activeCategory] || activeCategory;

  // Is a category pill active given the current keyword?
  const isPillActive = (cat: string) => {
    if (cat === "All") return activeCategory === "All";
    if (activeCategory === "All") return false;
    return (
      cat === activeCategory ||
      cat.toLowerCase().includes(activeCategory.toLowerCase()) ||
      activeCategory.toLowerCase().includes(cat.toLowerCase())
    );
  };

  // For filtered view: get unique actual categories in filteredProducts
  const filteredActualCategories = Array.from(
    new Set(filteredProducts.map((p) => p.category))
  );

  const ProductCard = ({ product }: { product: any }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      key={product.id}
      className="group"
    >
      <Link
        href={`/products/${product.id}`}
        className="block relative aspect-[4/5] bg-brand-sand rounded-3xl overflow-hidden mb-5"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <button
            onClick={(e) => handleQuickAdd(product, e)}
            className={`font-button uppercase tracking-wider text-xs px-6 py-3 rounded-full flex items-center gap-2 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl ${
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
        <p className="text-brand-text/50 font-sans text-xs uppercase tracking-widest mb-1">
          {product.category}
        </p>
        <Link href={`/products/${product.id}`}>
          <h3 className="font-heading font-bold text-brand-dark text-lg leading-snug mb-2 group-hover:text-brand-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="font-button font-bold text-brand-dark">₹{product.price}</p>
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
              Explore our premium range of food products, rooted in health, rich in flavour, and crafted for modern lifestyles.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="sticky top-[88px] z-40 bg-white/80 backdrop-blur-md border-b border-brand-border py-4">
        <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full font-button text-sm transition-all ${
                  isPillActive(cat)
                    ? "bg-brand-primary text-white shadow-md"
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
              className="w-full bg-brand-cream border border-brand-border rounded-full pl-12 pr-4 py-2.5 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
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
            // All view: group by actual WC category
            <div className="flex flex-col gap-16">
              {categories.filter(c => c !== "All").map(category => {
                const categoryProducts = filteredProducts.filter(p => p.category === category);
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
            // Keyword-filtered view: group by actual WC sub-categories (e.g. 'Millet Pasta' + 'Specialty Pasta')
            <div className="flex flex-col gap-16">
              {filteredActualCategories.length > 1
                ? filteredActualCategories.map(category => {
                    const categoryProducts = filteredProducts.filter(p => p.category === category);
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
                : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                    <AnimatePresence>
                      {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </AnimatePresence>
                  </div>
                )
              }
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
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      }
    >
      <ProductsPageInner />
    </Suspense>
  );
}
