"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

export function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-[80] backdrop-blur-sm"
          />

          {/* Side Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[90] shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-cream/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary text-white rounded-full">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-brand-dark">Your Cart</h3>
                  <p className="font-sans text-xs text-brand-text/60">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
                </div>
              </div>

              <button
                onClick={closeCart}
                className="p-2 rounded-full hover:bg-brand-sand transition-colors text-brand-dark"
                aria-label="Close Cart"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items List */}
            {cart.length > 0 ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-brand-border/40">
                {cart.map((item) => (
                  <div key={item.id} className="pt-4 first:pt-0 flex gap-4 items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-2xl bg-brand-sand shrink-0 border border-brand-border"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading font-bold text-brand-dark text-base truncate">
                        {item.name}
                      </h4>
                      <p className="font-button font-bold text-brand-primary text-sm mb-2">
                        ₹{item.price * item.quantity}
                      </p>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-brand-border rounded-full px-2 py-0.5 bg-brand-cream/30">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:text-brand-primary text-brand-dark transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-sans text-xs font-bold px-2 text-brand-dark">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:text-brand-primary text-brand-dark transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-brand-text/40 hover:text-red-500 transition-colors ml-auto"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-brand-cream flex items-center justify-center mb-4 text-brand-text/40">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h4 className="font-heading text-2xl font-bold text-brand-dark mb-2">Your Cart is Empty</h4>
                <p className="font-sans text-brand-text/70 text-sm max-w-xs mb-6">
                  Explore our wholesome products and add items to your cart.
                </p>
                <button
                  onClick={closeCart}
                  className="bg-brand-primary text-white font-button uppercase tracking-wider text-xs px-8 py-3.5 rounded-full hover:bg-brand-dark transition-colors shadow-md"
                >
                  Shop Now
                </button>
              </div>
            )}

            {/* Footer Summary & Checkout */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-brand-border bg-brand-cream/30 space-y-4">
                <div className="space-y-2 font-sans text-sm">
                  <div className="flex justify-between text-brand-text/80">
                    <span>Subtotal</span>
                    <span className="font-bold text-brand-dark">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-brand-text/80">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">
                      {subtotal >= 500 ? "FREE" : "₹50"}
                    </span>
                  </div>
                  <div className="flex justify-between text-brand-dark font-bold text-lg pt-2 border-t border-brand-border">
                    <span>Total</span>
                    <span>₹{subtotal >= 500 ? subtotal : subtotal + 50}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-brand-primary text-white font-button uppercase tracking-wider py-4 rounded-full hover:bg-brand-dark transition-all duration-300 shadow-lg flex items-center justify-center gap-2 group"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
