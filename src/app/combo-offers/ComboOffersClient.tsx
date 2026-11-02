"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShoppingBag, CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

export interface ComboItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  originalPrice: number;
  offerPrice: number;
  savings: string;
  tag: string;
  image: string;
  items: string[];
}

interface ComboOffersClientProps {
  hero: {
    badge: string;
    title: string;
    description: string;
  };
  combos: ComboItem[];
}

export function ComboOffersClient({ hero, combos }: ComboOffersClientProps) {
  const { addToCart } = useCart();
  const [addedComboId, setAddedComboId] = useState<string | null>(null);

  const handleAddToCart = (combo: ComboItem) => {
    addToCart({
      id: combo.id,
      name: combo.name,
      price: combo.offerPrice,
      image: combo.image,
    });
    setAddedComboId(combo.id);
    setTimeout(() => setAddedComboId(null), 2000);
  };

  return (
    <div className="bg-brand-cream min-h-screen pb-24">
      {/* Hero Header */}
      <section className="pt-32 pb-16 px-6 md:px-12 container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/20 text-brand-dark font-button text-xs uppercase tracking-wider mb-4 border border-brand-primary/40">
            <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
            {hero.badge}
          </div>
          <h1 className="font-heading text-5xl md:text-6xl text-brand-dark mb-6">
            {hero.title}
          </h1>
          <p className="font-sans text-brand-text/80 text-lg max-w-2xl mx-auto leading-relaxed">
            {hero.description}
          </p>
        </motion.div>
      </section>

      {/* Combos Grid */}
      <section className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {combos.map((combo, index) => (
            <motion.div
              key={combo.id || index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden shadow-lg border border-brand-border hover:shadow-2xl transition-all duration-300 flex flex-col group"
            >
              {/* Image Banner */}
              <div className="relative h-64 bg-brand-sand overflow-hidden">
                <img
                  src={combo.image}
                  alt={combo.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {combo.savings && (
                    <span className="bg-red-500 text-white font-button text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      {combo.savings}
                    </span>
                  )}
                  {combo.tag && (
                    <span className="bg-brand-dark text-white font-button text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      {combo.tag}
                    </span>
                  )}
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  {combo.subtitle && (
                    <p className="text-brand-primary font-button text-xs uppercase tracking-widest mb-1">
                      {combo.subtitle}
                    </p>
                  )}
                  <h3 className="font-heading text-2xl font-bold text-brand-dark mb-3">
                    {combo.name}
                  </h3>
                  <p className="font-sans text-brand-text/80 text-sm leading-relaxed mb-6 whitespace-pre-line">
                    {combo.description}
                  </p>

                  {/* Included Items */}
                  {combo.items && combo.items.length > 0 && (
                    <div className="bg-brand-cream/50 rounded-2xl p-4 mb-6 border border-brand-border/60">
                      <p className="font-button text-xs uppercase tracking-wider text-brand-dark font-bold mb-3">
                        What&apos;s Included:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {combo.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-sans text-brand-text">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Pricing & CTA */}
                <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                  <div>
                    {combo.originalPrice > combo.offerPrice && (
                      <span className="text-brand-text/50 font-sans text-sm line-through block">
                        ₹{combo.originalPrice}
                      </span>
                    )}
                    <span className="font-heading text-3xl font-bold text-brand-dark">
                      ₹{combo.offerPrice}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(combo)}
                    className={`px-6 py-3.5 rounded-full font-button text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                      addedComboId === combo.id
                        ? "bg-green-600 text-white"
                        : "bg-brand-primary text-white hover:bg-brand-dark shadow-md hover:shadow-lg"
                    }`}
                  >
                    {addedComboId === combo.id ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" /> Add Bundle
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
