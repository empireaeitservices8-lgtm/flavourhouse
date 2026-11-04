import { NextResponse } from "next/server";
import { api } from "@/lib/woocommerce";
import { getAllStoredProducts } from "@/lib/products-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Return admin-managed stored products if WooCommerce is not configured
    if (!process.env.WC_STORE_URL || !process.env.WC_CONSUMER_KEY) {
      const stored = getAllStoredProducts();
      return NextResponse.json(stored);
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
    console.error("WooCommerce fetch error, returning stored products:", error.response?.data || error.message);
    const stored = getAllStoredProducts();
    return NextResponse.json(stored);
  }
}
