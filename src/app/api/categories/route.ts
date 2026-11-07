import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const rows = await query(`
      SELECT c.id, c.name, c.slug, c.description, c.image,
             COUNT(p.id) as productCount
      FROM categories c
      LEFT JOIN products p ON p.categoryId = c.id AND p.isActive = 1
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    if (Array.isArray(rows) && rows.length > 0) {
      return NextResponse.json(
        rows.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-"),
          description: cat.description || "",
          image: cat.image || "",
          productCount: Number(cat.productCount) || 0,
        })),
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
          },
        }
      );
    }
  } catch (error: any) {
    console.warn("DB categories query failed, using fallback:", error.message);
  }

  // Fallback defaults
  const defaults = [
    { id: 1, name: "Pasta", slug: "pasta", productCount: 0 },
    { id: 2, name: "Vermicelli", slug: "vermicelli", productCount: 0 },
    { id: 3, name: "Noodles", slug: "noodles", productCount: 0 },
    { id: 4, name: "Cookies", slug: "cookies", productCount: 0 },
  ];
  return NextResponse.json(defaults);
}

