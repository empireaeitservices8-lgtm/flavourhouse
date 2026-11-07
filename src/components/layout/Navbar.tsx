"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  User,
  Package,
  MapPin,
  LogOut,
  ChevronDown,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Products", href: "/products" },
  { name: "Combo Offers", href: "/combo-offers" },
  { name: "Recipes", href: "/recipes" },
  { name: "Track Order", href: "/track-order" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, openCart } = useCart();
  const { customer, isLoggedIn, logout } = useCustomerAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close account menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleAccountClick = () => {
    if (!isLoggedIn) {
      router.push("/account/login");
    } else {
      setIsAccountMenuOpen((prev) => !prev);
    }
  };

  const handleLogout = () => {
    logout();
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b border-transparent",
          isScrolled
            ? "bg-brand-cream/95 backdrop-blur-md shadow-sm border-brand-border py-4"
            : "bg-transparent py-6"
        )}
      >
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Flavor House Logo"
              className="h-16 md:h-24 w-auto object-contain brightness-0"
            />
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
          <div className="flex items-center space-x-4 md:space-x-5 text-brand-dark">
            <Link
              href="/products"
              aria-label="Search"
              className="hover:text-brand-primary transition-colors p-1"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Customer Account Icon & Dropdown */}
            <div className="relative" ref={accountMenuRef}>
              <button
                onClick={handleAccountClick}
                aria-label="Account"
                className={cn(
                  "flex items-center gap-1.5 p-1 transition-colors hover:text-brand-primary",
                  isLoggedIn ? "text-brand-primary" : "text-brand-dark"
                )}
                title={isLoggedIn ? (customer?.name ? `Logged in as ${customer.name}` : "My Account") : "Sign In / Register"}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isLoggedIn
                      ? "bg-brand-primary/15 text-brand-primary ring-2 ring-brand-primary/30"
                      : "hover:bg-brand-sand/60"
                  )}
                >
                  <User className="w-4 h-4" />
                </div>
                {isLoggedIn && (
                  <span className="hidden xl:inline-block text-xs font-semibold max-w-[85px] truncate">
                    {customer?.name?.split(" ")[0]}
                  </span>
                )}
                {isLoggedIn && <ChevronDown className="w-3 h-3 hidden md:inline-block opacity-60" />}
              </button>

              {/* Desktop Account Dropdown */}
              <AnimatePresence>
                {isAccountMenuOpen && isLoggedIn && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-brand-border py-2 z-50"
                  >
                    {/* Customer header */}
                    <div className="px-4 py-3 border-b border-brand-border/60 bg-brand-cream/50">
                      <p className="text-xs uppercase tracking-wider text-brand-text/60 font-semibold font-button">
                        Signed In As
                      </p>
                      <p className="text-sm font-bold text-brand-dark truncate mt-0.5">
                        {customer?.name || "Valued Customer"}
                      </p>
                      <p className="text-xs text-brand-text/70 truncate">{customer?.email || customer?.phone}</p>
                    </div>

                    <div className="py-1 text-sm font-sans">
                      <Link
                        href="/account/profile"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-brand-dark hover:bg-brand-cream/70 hover:text-brand-primary transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-brand-primary/80" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        href="/account/orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-brand-dark hover:bg-brand-cream/70 hover:text-brand-primary transition-colors"
                      >
                        <Package className="w-4 h-4 text-brand-primary/80" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        href="/account/addresses"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-brand-dark hover:bg-brand-cream/70 hover:text-brand-primary transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-brand-primary/80" />
                        <span>My Addresses</span>
                      </Link>

                      <div className="border-t border-brand-border/60 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart Button */}
            <button
              onClick={openCart}
              aria-label="Cart"
              className="hover:text-brand-primary transition-colors relative p-1"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              aria-label="Toggle Menu"
              className="lg:hidden ml-1 p-1 hover:text-brand-primary transition-colors"
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
              transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-brand-cream z-[70] lg:hidden flex flex-col shadow-2xl border-l border-brand-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-brand-border/50">
                <div className="flex items-center">
                  <img
                    src="/logo.png"
                    alt="Flavor House Logo"
                    className="h-14 w-auto object-contain brightness-0"
                  />
                </div>
                <button
                  aria-label="Close Menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-brand-sand transition-colors text-brand-dark"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col px-6 py-6 space-y-4 overflow-y-auto">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "font-heading text-xl transition-colors hover:text-brand-primary",
                      pathname === link.href ? "text-brand-primary font-bold" : "text-brand-dark"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* Mobile Customer Account Section */}
              <div className="mt-auto p-6 border-t border-brand-border/60 bg-white/60">
                {isLoggedIn && customer ? (
                  <div className="space-y-3 font-sans">
                    <div className="pb-2 border-b border-brand-border/60">
                      <p className="text-xs uppercase tracking-wider text-brand-text/60 font-semibold font-button">
                        Signed in
                      </p>
                      <p className="text-base font-bold text-brand-dark truncate">{customer.name}</p>
                      <p className="text-xs text-brand-text/70 truncate">{customer.email || customer.phone}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-1 pt-1 text-sm">
                      <Link
                        href="/account/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 py-2 px-2 text-brand-dark hover:text-brand-primary hover:bg-brand-cream/60 rounded-lg transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-brand-primary" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        href="/account/orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 py-2 px-2 text-brand-dark hover:text-brand-primary hover:bg-brand-cream/60 rounded-lg transition-colors"
                      >
                        <Package className="w-4 h-4 text-brand-primary" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        href="/account/addresses"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 py-2 px-2 text-brand-dark hover:text-brand-primary hover:bg-brand-cream/60 rounded-lg transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-brand-primary" />
                        <span>My Addresses</span>
                      </Link>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 px-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 font-sans">
                    <p className="text-xs text-brand-text/70 text-center">
                      Sign in to view your orders, addresses, and profile
                    </p>
                    <Link
                      href="/account/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary text-white rounded-xl shadow-md hover:bg-brand-primaryHover transition-all text-sm font-button font-bold uppercase tracking-wider"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In / Register</span>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
