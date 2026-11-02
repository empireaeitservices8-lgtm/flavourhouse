import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flavor House | Rooted in Health, Rich in Flavour",
  description: "Rooted in Health, Rich in Flavour. Discover premium organic foods made with wholesome ingredients and traditional goodness for modern lifestyles.",
};

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppPop } from "@/components/layout/WhatsAppPop";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${cormorant.variable} ${inter.variable} ${plusJakarta.variable} antialiased`}
    >
      <body className="font-sans bg-background text-foreground overflow-x-hidden min-h-screen flex flex-col">
        <CartProvider>
          <Navbar />
          <main className="flex-grow pt-24">
            {children}
          </main>
          <Footer />
          <WhatsAppPop />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
