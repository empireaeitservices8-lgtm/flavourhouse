"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Check, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function FeaturedProductsSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<number | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Priority to featured products, otherwise recent ones
          const featured = data.filter((p: any) => p.isFeatured && p.isActive);
          if (featured.length >= 4) {
            setProducts(featured.slice(0, 8));
          } else {
            // Include recent products to make a showcase of 4-8
            const nonFeatured = data.filter((p: any) => !p.isFeatured && p.isActive);
            const combined = [...featured, ...nonFeatured];
            setProducts(combined.slice(0, 8));
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleQuickAdd = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  if (loading || products.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-brand-primary text-xs uppercase tracking-widest font-button font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked From Our Kitchen</span>
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-brand-dark">
              Featured <span className="italic font-subheading font-normal">Creations</span>
            </h2>
          </div>

          <Link
            href="/products"
            className="group inline-flex items-center gap-2 font-button text-sm uppercase tracking-wider font-semibold text-brand-dark hover:text-brand-primary transition-colors"
          >
            <span>Explore All Products</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, idx) => (
            <motion.div
              key={product.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="group"
            >
              <Link
                href={`/products/${product.id}`}
                className="block relative aspect-[4/5] bg-brand-sand rounded-3xl overflow-hidden mb-5 border border-brand-border/60 shadow-xs"
              >
                <img
                  src={product.image || "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <button
                    onClick={(e) => handleQuickAdd(product, e)}
                    className={`font-button uppercase tracking-wider text-xs px-6 py-3 rounded-full flex items-center gap-2 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl cursor-pointer ${
                      addedId === product.id
                        ? "bg-emerald-600 text-white"
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
                  <h3 className="font-heading font-bold text-brand-dark text-lg leading-snug mb-2 group-hover:text-brand-primary transition-colors line-clamp-1">
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
          ))}
        </div>
      </div>
    </section>
  );
}

