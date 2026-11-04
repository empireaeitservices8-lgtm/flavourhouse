"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppPop } from "@/components/layout/WhatsAppPop";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main className="flex-grow">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24">{children}</main>
      <Footer />
      <WhatsAppPop />
      <CartDrawer />
    </>
  );
}

