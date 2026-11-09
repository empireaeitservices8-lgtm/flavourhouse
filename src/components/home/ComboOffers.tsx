"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, ShoppingBag, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

export function ComboOffers({ acf }: { acf?: any }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<number | null>(null);

  useEffect(() => {
    // 1. First attempt to fetch dedicated combo offers
    fetch("/api/combos", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.combos) && data.combos.length > 0) {
          const formatted = data.combos.slice(0, 3).map((c: any) => ({
            id: c.dbId || c.id,
            name: c.name,
            category: c.subtitle || "Combo Offer",
            price: c.offerPrice,
            originalPrice: c.originalPrice > c.offerPrice ? c.originalPrice : null,
            image: c.image,
            tag: c.tag,
            savings: c.savings,
          }));
          setProducts(formatted);
          setLoading(false);
          return;
        }

        // 2. Fallback to products if no dedicated combos
        return fetch("/api/products", { cache: "no-store" })
          .then((res) => res.json())
          .then((pData) => {
            if (Array.isArray(pData)) {
              let combos = pData.filter((p: any) => {
                const cat = (p.category || "").toLowerCase();
                const name = (p.name || "").toLowerCase();
                return (
                  cat.includes("combo") ||
                  cat.includes("bundle") ||
                  name.includes("bundle") ||
                  name.includes("pack") ||
                  name.includes("delight") ||
                  p.isFeatured
                );
              });

              if (combos.length === 0) {
                combos = pData.slice(0, 3);
              } else {
                combos = combos.slice(0, 3);
              }

              setProducts(combos);
            }
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error("Failed to fetch combos:", err);
        setLoading(false);
      });
  }, []);

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  if (loading) return null;
  if (products.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Luxury Brown Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3F3424] via-[#6E5432] to-[#3F3424]"></div>
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 0.8px, transparent 0.8px)', backgroundSize: '16px 16px' }}></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-[#B8945F]/30 border border-[#B8945F]/50 px-4 py-1.5 rounded-full text-brand-sand text-xs font-button font-medium uppercase tracking-widest mb-4"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B8945F]" />
              <span>{acf?.combos_badge || "Special Curations"}</span>
            </motion.div>
            
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
              {acf?.combos_title || "Value Combo Packs"}
            </h2>
            <p className="font-sans text-brand-sand/80 max-w-xl text-lg">
              {acf?.combos_subtitle || "Get the best of nutrition and flavour combined into special discounted bundles."}
            </p>
          </div>

          <Link
            href="/combo-offers"
            className="group flex items-center gap-3 bg-brand-sand text-brand-dark px-8 py-4 rounded-full font-button text-sm uppercase tracking-wider font-semibold hover:bg-white transition-all shadow-lg hover:shadow-xl self-start md:self-auto"
          >
            <span>{acf?.combos_button_text || "Explore All Combos"}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product, idx) => (
            <motion.div
              key={product.id || idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 flex flex-col justify-between hover:bg-white/15 transition-all duration-300 group"
            >
              <div>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-brand-dark/40">
                  <img
                    src={product.image || "/images/breakfast_bundle.png"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-brand-primary text-white text-[10px] font-button font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    {product.category || "Featured"}
                  </div>
                </div>

                <h3 className="font-heading text-2xl font-bold text-white mb-2 line-clamp-1">
                  {product.name}
                </h3>
                
                <p className="font-sans text-brand-sand/70 text-sm mb-6 line-clamp-2">
                  {product.description || "Nutritious and delicious blend of ancient grains crafted for your health and vitality."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  <span className="text-xs text-brand-sand/60 block font-sans">Special Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white font-button">₹{product.price}</span>
                    {product.discountPrice && (
                      <span className="text-sm text-brand-sand/50 line-through">₹{product.discountPrice}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => handleAddToCart(product, e)}
                  className={`p-3.5 rounded-full transition-all shadow-md cursor-pointer ${
                    addedId === product.id
                      ? "bg-emerald-500 text-white"
                      : "bg-brand-primary text-white hover:bg-brand-secondary hover:scale-105"
                  }`}
                  aria-label="Add to cart"
                >
                  {addedId === product.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <ShoppingBag className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
