"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  PlusCircle,
  UserCheck,
  Store,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChefHat,
  ChevronRight,
  FolderTree,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
} from "lucide-react";
import { getAdminToken, removeAdminToken, fetchFromBackend } from "@/lib/api";

const SIDEBAR_ITEMS = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Add Product", href: "/admin/products/add", icon: PlusCircle },
  { name: "Combo Offers", href: "/admin/combos", icon: Sparkles },
  { name: "Recipes", href: "/admin/recipes", icon: BookOpen },
  { name: "Home & Banners", href: "/admin/homepage", icon: ImageIcon },
  { name: "Admin Profile", href: "/admin/profile", icon: UserCheck },
  { name: "Store Settings", href: "/admin/store", icon: Store },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Normalize check to handle /admin and /admin/login routes
  const isLoginPage = Boolean(
    pathname && (
      pathname === "/admin" ||
      pathname === "/admin/" ||
      pathname === "/admin/login" ||
      pathname === "/admin/login/" ||
      pathname.startsWith("/admin/login")
    )
  );

  const [isLoading, setIsLoading] = useState(!isLoginPage);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // If on login page, layout does not block rendering
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    const token = getAdminToken();

    if (!token) {
      setIsLoading(false);
      router.replace("/admin/login");
      return;
    }

    // Already verified session in memory: never block navigation between admin tabs
    if (adminUser) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    // Initial session verification
    fetchFromBackend("/api/admin/auth/me")
      .then((res) => {
        if (!isMounted) return;
        if (res.ok && res.data?.admin) {
          setAdminUser(res.data.admin);
          setIsLoading(false);
        } else {
          removeAdminToken();
          setIsLoading(false);
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        removeAdminToken();
        setIsLoading(false);
        router.replace("/admin/login");
      });

    return () => {
      isMounted = false;
    };
  }, [isLoginPage, router]);

  const handleLogout = () => {
    removeAdminToken();
    fetchFromBackend("/api/admin/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#241D14] flex flex-col items-center justify-center text-[#F8F1D8]">
        <div className="w-12 h-12 border-4 border-[#B8945F]/30 border-t-[#B8945F] rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-sans tracking-wide text-[#EBDCC5]">Authenticating Admin Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3F3424] flex flex-col md:flex-row antialiased font-sans">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-[#2D2318] text-[#FFFDF8] px-4 py-3 flex items-center justify-between border-b border-[#443625] sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-[#B8945F]" />
          <span className="font-heading font-bold text-lg text-[#FFFDF8]">Flavour House</span>
          <span className="text-[10px] uppercase bg-[#B8945F]/20 text-[#D8C7B0] font-button px-2 py-0.5 rounded tracking-wider">Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-[#3D3021] text-[#EBDCC5] hover:text-white focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar (Desktop + Mobile overlay) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-50 w-72 bg-[#2D2318] text-[#EBDCC5] border-r border-[#443625] flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-xl md:shadow-none ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Brand Logo & Title */}
          <div className="p-6 border-b border-[#443625] flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#B8945F]/15 border border-[#B8945F]/30 flex items-center justify-center text-[#B8945F] group-hover:scale-105 transition-transform">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-white tracking-wide text-base">Flavour House</h1>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 text-[#EBDCC5] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-[#A17D49] font-button">
              Store Management
            </div>
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const cleanPath = (pathname || "").replace(/\/$/, "");
              const cleanHref = item.href.replace(/\/$/, "");

              // Strict active checking so "Add Product" and "Products" don't highlight together
              let isActive = false;
              if (cleanHref === "/admin/products") {
                isActive = cleanPath === "/admin/products" || cleanPath.startsWith("/admin/products/edit");
              } else if (cleanHref === "/admin/dashboard") {
                isActive = cleanPath === "/admin/dashboard" || cleanPath === "/admin";
              } else {
                isActive = cleanPath === cleanHref;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-button transition-all duration-150 ${
                    isActive
                      ? "bg-[#B8945F] text-white shadow-md font-semibold"
                      : "text-[#D8C7B0] hover:text-white hover:bg-[#3D3021]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#B8945F]"}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-90" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-[#443625] bg-[#241D14]">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#3D3021] hover:bg-[#4D3D2B] text-[#EBDCC5] hover:text-white text-xs font-button transition border border-[#50402F]"
              title="View customer facing website"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#B8945F]" />
              <span>View Store</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#522521]/60 hover:bg-[#682B26] text-[#FFD7D5] hover:text-white text-xs font-button transition border border-[#682B26] cursor-pointer"
              title="Sign out of admin panel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        ></div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#FAF7F2]">
        {/* Top desktop subheader */}
        <header className="hidden md:flex bg-[#FFFDF8] border-b border-[#E9DDC5] px-8 py-3.5 items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-button font-semibold text-[#A17D49] tracking-wider">Flavour House Management Console</span>
          </div>
        </header>

        {/* Page Inner Container */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
