import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductDetailsClient } from "@/components/products/ProductDetailsClient";
import { api } from "@/lib/woocommerce";
import { PRODUCTS } from "@/lib/data"; // Fallback

export const dynamic = "force-dynamic";
export const revalidate = 0;

// We remove generateStaticParams so this page dynamically renders on every request
// ensuring any new product added in WooCommerce is immediately available.

export default async function SingleProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let product: any;
  let relatedProducts: any[] = [];

  try {
    if (!process.env.WC_STORE_URL || !process.env.WC_CONSUMER_KEY) {
      throw new Error("No WooCommerce configured");
    }

    // Fetch product from WooCommerce
    const response = await api.get(`products/${id}`);
    const data = response.data;

    product = {
      id: data.id,
      name: data.name,
      category: data.categories[0]?.name || "Uncategorized",
      price: parseFloat(data.price || "0"),
      image: data.images[0]?.src || "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81",
      description: data.short_description || data.description,
    };

    // Fetch related products from same category
    const catId = data.categories[0]?.id;
    if (catId) {
      const relatedRes = await api.get("products", {
        category: catId,
        per_page: 5,
      });
      
      relatedProducts = relatedRes.data
        .filter((p: any) => p.id !== data.id)
        .slice(0, 4)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.categories[0]?.name || "Uncategorized",
          price: parseFloat(p.price || "0"),
          image: p.images[0]?.src || "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81",
        }));
    }

  } catch (error) {
    // Fallback to local data
    console.error("WooCommerce error on product detail:", error);
    product = PRODUCTS.find((p) => p.id.toString() === id);
    if (product) {
      relatedProducts = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
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
