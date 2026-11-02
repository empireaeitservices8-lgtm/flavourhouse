import { NextResponse } from "next/server";
import { api } from "@/lib/woocommerce";
import { PRODUCTS } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Fallback to local data if WooCommerce is not configured
    if (!process.env.WC_STORE_URL || !process.env.WC_CONSUMER_KEY) {
      console.log("WooCommerce not configured, returning local products.");
      return NextResponse.json(PRODUCTS);
    }

    const response = await api.get("products", {
      per_page: 50,
      status: "publish",
    });

    const products = response.data.map((product: any) => ({
      id: product.id,
      name: product.name,
      category: product.categories[0]?.name || "Uncategorized",
      price: parseFloat(product.price || "0"),
      image: product.images[0]?.src || "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81", // Fallback image
      description: product.short_description || product.description,
    }));

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("WooCommerce fetch error:", error.response?.data || error.message);
    // Fallback on error
    return NextResponse.json(PRODUCTS);
  }
}
