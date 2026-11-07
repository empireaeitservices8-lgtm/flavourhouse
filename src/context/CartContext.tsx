"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount & auto-sync prices with current store prices
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("flavorhouse_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error(e);
    }

    // Background price sync with latest store product prices
    async function syncPrices() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (res.ok) {
          const products = await res.json();
          if (Array.isArray(products) && products.length > 0) {
            setCart((prev) => {
              let updated = false;
              const synced = prev.map((cartItem) => {
                const match = products.find(
                  (p: any) => String(p.id) === String(cartItem.id) || p.name === cartItem.name
                );
                if (match) {
                  const currentPrice = Number(
                    match.discountPrice && match.discountPrice > 0 ? match.discountPrice : match.price
                  );
                  if (cartItem.price !== currentPrice || (match.image && cartItem.image !== match.image)) {
                    updated = true;
                    return {
                      ...cartItem,
                      price: currentPrice,
                      name: match.name || cartItem.name,
                      image: match.image || cartItem.image,
                    };
                  }
                }
                return cartItem;
              });
              return updated ? synced : prev;
            });
          }
        }
      } catch (err) {
        // Fallback silently if offline
      }
    }

    syncPrices();
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("flavorhouse_cart", JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  const addToCart = (item: Omit<CartItem, "quantity">, qtyToAdd = 1) => {
    const itemPrice = Number(item.price);
    setCart((prev) => {
      const existing = prev.find((i) => String(i.id) === String(item.id));
      if (existing) {
        return prev.map((i) =>
          String(i.id) === String(item.id)
            ? {
                ...i,
                ...item,
                price: itemPrice, // Always adopt the updated price
                quantity: i.quantity + qtyToAdd,
              }
            : i
        );
      }
      return [...prev, { ...item, price: itemPrice, quantity: qtyToAdd }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string | number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string | number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
