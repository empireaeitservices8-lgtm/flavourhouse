"use client";

import { useState } from "react";
import { ShoppingBag, Heart, Share2, CheckCircle2, Plus, Minus, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

export function ProductDetailsClient({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAddToCart = () => {
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image }, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2500);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col justify-center">
      <p className="text-brand-primary font-button text-sm uppercase tracking-widest mb-3">
        {product.category}
      </p>
      <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-dark mb-4 leading-tight">
        {product.name}
      </h1>
      <div className="flex items-baseline gap-3 mb-6">
        <p className="font-heading text-4xl font-bold text-brand-dark">
          ₹{product.price * quantity}
        </p>
        {quantity > 1 && (
          <span className="text-brand-text/60 font-sans text-sm">
            (₹{product.price} each)
          </span>
        )}
      </div>
      
      <div className="prose prose-brand text-brand-text/80 font-sans mb-8 leading-relaxed">
        <p>
          Experience the authentic taste and health benefits of our premium {product.name}. 
          Rooted in health and rich in flavour, it is crafted with 100% natural ingredients without artificial preservatives.
        </p>
        <ul className="space-y-2 mt-4 font-sans text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
            <span>100% Natural & Organic Ingredients</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
            <span>Rich in Dietary Fiber & Protein</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
            <span>Zero Artificial Preservatives or Additives</span>
          </li>
        </ul>
      </div>

      {/* Quantity Control */}
      <div className="flex items-center gap-4 mb-8">
        <span className="font-button text-xs uppercase tracking-wider text-brand-dark font-bold">Quantity:</span>
        <div className="flex items-center border border-brand-border bg-white rounded-full px-3 py-1.5 shadow-sm">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-1 rounded-full text-brand-dark hover:bg-brand-sand transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-heading font-bold text-brand-dark px-4 text-lg min-w-[2rem] text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="p-1 rounded-full text-brand-dark hover:bg-brand-sand transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleAddToCart}
          className={`flex-1 py-4 px-8 rounded-full font-button uppercase tracking-wide transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
            isAdded
              ? "bg-green-600 text-white"
              : "bg-brand-primary text-white hover:bg-brand-dark hover:shadow-xl"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-5 h-5" /> Added {quantity} to Cart!
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" /> Add to Cart
            </>
          )}
        </button>

        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className={`p-4 rounded-full border transition-all ${
            isWishlisted
              ? "bg-red-50 border-red-200 text-red-500"
              : "border-brand-border text-brand-dark hover:border-brand-primary hover:text-brand-primary bg-white"
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        <button
          onClick={handleShare}
          className="p-4 rounded-full border border-brand-border text-brand-dark hover:border-brand-primary hover:text-brand-primary transition-all bg-white relative"
          aria-label="Share"
        >
          {copied ? <Check className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
          {copied && (
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-dark text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap shadow-md">
              Link Copied!
            </span>
          )}
        </button>
      </div>
      
      {/* Delivery Info */}
      <div className="mt-8 bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-brand-border text-sm font-sans text-brand-dark space-y-2">
        <p className="flex items-center gap-3">
          <span className="text-xl">🚚</span> <strong>Free Delivery</strong> on orders over ₹500
        </p>
        <p className="flex items-center gap-3">
          <span className="text-xl">⏱️</span> Delivery usually takes 3-5 business days
        </p>
        <p className="flex items-center gap-3">
          <span className="text-xl">🛡️</span> 100% Quality Satisfaction Guarantee
        </p>
      </div>
    </div>
  );
}
