import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flavor House | Rooted in Health, Rich in Flavour",
  description: "Rooted in Health, Rich in Flavour. Discover premium organic foods made with wholesome ingredients and traditional goodness for modern lifestyles.",
};

import { CartProvider } from "@/context/CartContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { MainLayoutWrapper } from "@/components/layout/MainLayoutWrapper";

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
        <CustomerAuthProvider>
          <CartProvider>
            <MainLayoutWrapper>{children}</MainLayoutWrapper>
          </CartProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
