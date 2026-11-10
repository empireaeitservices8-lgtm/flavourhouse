import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductDetailsClient } from "@/components/products/ProductDetailsClient";
import { PRODUCTS } from "@/lib/data";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SingleProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let product: any = null;
  let relatedProducts: any[] = [];

  // 1. Direct MySQL Query
  try {
    const isNumeric = /^\d+$/.test(id);
    let rows: any[] = [];

    if (isNumeric) {
      rows = await query(
        `SELECT p.id, p.name, p.slug, p.description, p.image, p.price, p.discountPrice,
                p.stock, p.SKU, p.isActive, p.isFeatured, c.name as category, p.categoryId
         FROM products p
         LEFT JOIN categories c ON p.categoryId = c.id
         WHERE p.id = ?
         LIMIT 1`,
        [Number(id)]
      );
    } else {
      rows = await query(
        `SELECT p.id, p.name, p.slug, p.description, p.image, p.price, p.discountPrice,
                p.stock, p.SKU, p.isActive, p.isFeatured, c.name as category, p.categoryId
         FROM products p
         LEFT JOIN categories c ON p.categoryId = c.id
         WHERE p.slug = ? OR LOWER(p.name) = LOWER(?)
         LIMIT 1`,
        [id, id.replace(/-/g, " ")]
      );
    }

    if (Array.isArray(rows) && rows.length > 0) {
      const p = rows[0];
      let relRows: any[] = [];
      if (p.categoryId) {
        relRows = await query(
          `SELECT p.id, p.name, p.slug, p.price, p.discountPrice, p.image, p.stock, c.name as category
           FROM products p
           LEFT JOIN categories c ON p.categoryId = c.id
           WHERE p.categoryId = ? AND p.id != ? AND p.isActive = 1
           ORDER BY p.id DESC
           LIMIT 4`,
          [p.categoryId, p.id]
        );
      }

      product = {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category || "Pasta",
        categoryId: p.categoryId,
        price: Number(p.price),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        image: p.image || "/images/pasta.png",
        description: p.description || `${p.name} - Wholesome organic millet product by Flavor House.`,
        stock: p.stock ?? 100,
        inStock: (p.stock ?? 100) > 0,
        isActive: Boolean(p.isActive),
        isFeatured: Boolean(p.isFeatured),
        SKU: p.SKU,
      };

      relatedProducts = (relRows || []).map((r: any) => ({
        ...r,
        price: Number(r.price),
        discountPrice: r.discountPrice ? Number(r.discountPrice) : null,
        category: r.category || "Pasta",
      }));
    }
  } catch (error) {
    console.warn("Direct DB query for product failed, trying fallback:", error);
  }

  // 2. Fallback to static PRODUCTS
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
                    <div className="flex items-center gap-2">
                      <p className="font-button font-bold text-brand-dark">
                        ₹{related.discountPrice && Number(related.discountPrice) > 0 && Number(related.discountPrice) < Number(related.price)
                          ? related.discountPrice
                          : related.price}
                      </p>
                      {related.discountPrice && Number(related.discountPrice) > 0 && Number(related.discountPrice) < Number(related.price) && (
                        <p className="font-sans text-xs text-brand-text/50 line-through">
                          ₹{related.price}
                        </p>
                      )}
                    </div>
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
