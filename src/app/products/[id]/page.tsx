import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductDetailsClient } from "@/components/products/ProductDetailsClient";
import { PRODUCTS } from "@/lib/data";

export const revalidate = 60;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:4000";

export default async function SingleProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let product: any = null;
  let relatedProducts: any[] = [];

  try {
    const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      product = data;
      relatedProducts = data.relatedProducts || [];
    }
  } catch (error) {
    console.warn("Failed to fetch product from backend, trying fallback:", error);
  }

  if (!product) {
    const fallback = PRODUCTS.find((p) => p.id.toString() === id.toString() || p.name.toLowerCase().replace(/\s+/g, "-") === id.toLowerCase());
    if (fallback) {
      product = {
        ...fallback,
        description: `${fallback.name} - Premium healthy organic millet product by Flavor House.`,
        inStock: true,
      };
      relatedProducts = PRODUCTS.filter((p) => p.category === fallback.category && p.id !== fallback.id).slice(0, 4);
    }
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-brand-cream pt-10 pb-24">
      <div className="container mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm font-sans flex-wrap">
          <Link href="/products" className="text-brand-text/60 hover:text-brand-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </Link>
          <span className="text-brand-text/40">/</span>
          <span className="text-brand-text/60">{product.category}</span>
          <span className="text-brand-text/40">/</span>
          <span className="text-brand-dark font-medium">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 mb-24 items-start">
          {/* Product Image */}
          <div className="relative aspect-square lg:aspect-[4/5] bg-brand-sand rounded-[2rem] overflow-hidden shadow-xl border border-white sticky top-28">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Details (Client Interactive) */}
          <ProductDetailsClient product={product} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="font-heading text-3xl font-bold text-brand-dark mb-10 text-center">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((related) => (
                <Link href={`/products/${related.id}`} key={related.id} className="group flex flex-col">
                  <div className="relative aspect-[4/5] bg-brand-sand rounded-3xl overflow-hidden mb-4 border border-white/50 shadow-sm group-hover:shadow-lg transition-all">
                    <img 
                      src={related.image} 
                      alt={related.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-2">
                    <p className="text-brand-primary text-xs uppercase tracking-wider font-button mb-1">
                      {related.category}
                    </p>
                    <h3 className="font-heading font-bold text-brand-dark text-lg mb-1 group-hover:text-brand-primary transition-colors">
                      {related.name}
                    </h3>
                    <p className="font-button font-bold text-brand-dark">
                      ₹{related.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
