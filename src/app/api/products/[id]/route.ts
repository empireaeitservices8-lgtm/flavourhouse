import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { PRODUCTS } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const isNumeric = /^\d+$/.test(id);
    let rows: any[] = [];

    if (isNumeric) {
      rows = await query(
        `SELECT p.id, p.name, p.slug, p.description, p.image, p.price, p.discountPrice,
                p.stock, p.SKU, p.isActive, p.isFeatured, c.name as category, p.categoryId,
                p.createdAt
         FROM products p
         LEFT JOIN categories c ON p.categoryId = c.id
         WHERE p.id = ?
         LIMIT 1`,
        [Number(id)]
      );
    } else {
      rows = await query(
        `SELECT p.id, p.name, p.slug, p.description, p.image, p.price, p.discountPrice,
                p.stock, p.SKU, p.isActive, p.isFeatured, c.name as category, p.categoryId,
                p.createdAt
         FROM products p
         LEFT JOIN categories c ON p.categoryId = c.id
         WHERE p.slug = ? OR LOWER(p.name) = LOWER(?)
         LIMIT 1`,
        [id, id.replace(/-/g, " ")]
      );
    }

    if (Array.isArray(rows) && rows.length > 0) {
      const p = rows[0];

      // Fetch related products in the same category
      let related: any[] = [];
      if (p.categoryId) {
        related = await query(
          `SELECT id, name, slug, price, discountPrice, image, stock, c.name as category
           FROM products p
           LEFT JOIN categories c ON p.categoryId = c.id
           WHERE p.categoryId = ? AND p.id != ? AND p.isActive = 1
           ORDER BY p.id DESC
           LIMIT 4`,
          [p.categoryId, p.id]
        );
      }

      const product = {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category || "Pasta",
        categoryId: p.categoryId,
        price: Number(p.price),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        image: p.image || "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81",
        description: p.description || `${p.name} - Wholesome organic millet product by Flavour House.`,
        stock: p.stock ?? 100,
        inStock: (p.stock ?? 100) > 0,
        isActive: Boolean(p.isActive),
        isFeatured: Boolean(p.isFeatured),
        SKU: p.SKU,
        relatedProducts: (related || []).map((r: any) => ({
          ...r,
          price: Number(r.price),
          discountPrice: r.discountPrice ? Number(r.discountPrice) : null,
          category: r.category || "Pasta",
        })),
      };

      return NextResponse.json(product, {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      });
    }
  } catch (error: any) {
    console.warn("DB query for single product failed, falling back:", error.message);
  }

  // Fallback to static PRODUCTS
  const fallback = PRODUCTS.find(
    (p) =>
      p.id.toString() === id.toString() ||
      p.name.toLowerCase().replace(/\s+/g, "-") === id.toLowerCase()
  );

  if (fallback) {
    const related = PRODUCTS.filter(
      (p) => p.category === fallback.category && p.id !== fallback.id
    ).slice(0, 4);

    return NextResponse.json({
      ...fallback,
      description: `${fallback.name} - Premium healthy organic millet product by Flavor House.`,
      inStock: true,
      relatedProducts: related,
    });
  }

  return NextResponse.json({ error: "Product not found" }, { status: 404 });
}

