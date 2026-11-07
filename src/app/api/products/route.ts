import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { PRODUCTS } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("all") !== "true";

    let sql = `
      SELECT p.id, p.name, p.slug, p.description, p.image, p.price, p.discountPrice,
             p.stock, p.SKU, p.isActive, p.isFeatured, c.name as category, p.categoryId,
             p.createdAt
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (activeOnly) {
      conditions.push("p.isActive = 1");
    }

    if (category && category !== "All") {
      conditions.push("(LOWER(c.name) = LOWER(?) OR LOWER(c.slug) = LOWER(?))");
      params.push(category, category.toLowerCase());
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    // Newest products first!
    sql += " ORDER BY p.id DESC";

    const rows = await query(sql, params);

    if (Array.isArray(rows) && rows.length > 0) {
      const formatted = rows.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category || "Pasta",
        categoryId: p.categoryId,
        price: Number(p.price),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        image: p.image || "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81",
        description: p.description,
        stock: p.stock ?? 100,
        inStock: (p.stock ?? 100) > 0,
        isActive: Boolean(p.isActive),
        isFeatured: Boolean(p.isFeatured),
        SKU: p.SKU,
      }));

      return NextResponse.json(formatted, {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      });
    }
  } catch (error: any) {
    console.warn("MySQL products fetch failed, using fallback:", error.message);
  }

  // Resilient fallback: Always return seed products so website never goes down
  return NextResponse.json(PRODUCTS, {
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
    },
  });
}
