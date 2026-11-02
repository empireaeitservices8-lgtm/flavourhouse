"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Products", href: "/products" },
  { name: "Combo Offers", href: "/combo-offers" },
  { name: "Recipes", href: "/recipes" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b border-transparent",
          isScrolled
            ? "bg-brand-cream/90 backdrop-blur-md shadow-sm border-brand-border py-4"
            : "bg-transparent py-6"
        )}
      >
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="Flavor House Logo" className="h-16 md:h-24 w-auto object-contain brightness-0" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "font-button text-sm uppercase tracking-wider font-medium transition-colors hover:text-brand-primary",
                  pathname === link.href ? "text-brand-primary" : "text-brand-text"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center space-x-5 text-brand-dark">
            <button aria-label="Search" className="hover:text-brand-primary transition-colors">
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={openCart}
              aria-label="Cart"
              className="hover:text-brand-primary transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-brand-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </button>
            
            {/* Mobile Menu Toggle */}
            <button
              aria-label="Toggle Menu"
              className="lg:hidden ml-2"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] lg:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-brand-cream z-[70] lg:hidden flex flex-col shadow-2xl border-l border-brand-border"
            >
              <div className="flex items-center justify-between p-6 border-b border-brand-border/50">
                <div className="flex items-center">
                  <img src="/logo.png" alt="Flavor House Logo" className="h-14 w-auto object-contain brightness-0" />
                </div>
                <button
                  aria-label="Close Menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-brand-sand transition-colors text-brand-dark"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col px-6 py-8 space-y-6 overflow-y-auto">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "font-heading text-2xl transition-colors hover:text-brand-primary",
                      pathname === link.href ? "text-brand-primary" : "text-brand-dark"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="mt-auto p-6 border-t border-brand-border/50">
                {/* Removed Wishlist and Account buttons */}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
