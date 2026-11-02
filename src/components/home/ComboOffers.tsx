"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

export function ComboOffers({ acf }: { acf?: any }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/products/", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        // Find products that might be combos, or just take the first 3
        let combos = data.filter((p: any) => 
          p.category.toLowerCase().includes("combo") || 
          p.category.toLowerCase().includes("bundle") ||
          p.name.toLowerCase().includes("bundle")
        );
        
        if (combos.length === 0) {
          combos = data.slice(0, 3);
        } else {
          combos = combos.slice(0, 3);
        }
        
        setProducts(combos);
        setLoading(false);
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
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-paper.png")' }}></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/20 border border-brand-primary/50 text-brand-cream font-button text-sm mb-4"
            >
              <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
              {acf?.combo_badge || "OUR TOP PICKS"}
            </motion.div>
            <h2 className="font-heading text-4xl md:text-6xl font-bold text-white mb-4">
              {acf?.combo_title || "Featured Products"}
            </h2>
            <p className="font-sans text-brand-sand/80 text-lg max-w-xl">
              {acf?.combo_description || "Get the best of Flavor House with our curated organic selection. Perfect for modern, healthy living."}
            </p>
          </div>
          <Link href={acf?.combo_button_link || "/combo-offers"} className="shrink-0 flex items-center gap-2 text-brand-cream hover:text-brand-primary font-button border-b border-brand-cream hover:border-brand-primary pb-1 transition-all">
            {acf?.combo_button_text || "View All Combos"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Link href={`/products/${product.id}`} key={product.id}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 border border-white/20 hover:border-brand-primary/50 transition-colors group h-full flex flex-col"
              >
                <div className="relative h-64 rounded-xl overflow-hidden mb-6 bg-brand-cream">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-heading text-2xl font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
                <p className="font-sans text-brand-sand/80 text-sm mb-6 line-clamp-2 flex-grow">
                  {product.description?.replace(/<[^>]*>?/gm, '') || product.category}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-white font-heading text-2xl font-bold">₹{product.price}</span>
                  </div>
                  <button 
                    onClick={(e) => handleAddToCart(product, e)}
                    className={`px-6 py-2.5 rounded-full font-button text-sm transition-colors flex items-center gap-2 ${
                      addedId === product.id 
                        ? "bg-green-600 text-white" 
                        : "bg-brand-primary text-white hover:bg-brand-cream hover:text-brand-dark"
                    }`}
                  >
                    {addedId === product.id ? "Added!" : "Add to Cart"}
                  </button>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
