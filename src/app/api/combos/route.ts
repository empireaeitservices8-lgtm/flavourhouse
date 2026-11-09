import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query<any[]>(
      "SELECT * FROM combo_offers WHERE isActive = 1 ORDER BY id DESC"
    );

    const combos = (rows || []).map((c: any) => {
      let itemsList: string[] = [];
      if (Array.isArray(c.items)) {
        itemsList = c.items;
      } else if (typeof c.items === "string") {
        try {
          itemsList = JSON.parse(c.items);
        } catch {
          itemsList = c.items.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
        }
      }

      return {
        id: `combo-db-${c.id}`,
        dbId: c.id,
        name: c.name,
        subtitle: c.subtitle || "Special Combo Pack",
        description: c.description || "",
        originalPrice: Number(c.originalPrice) || 0,
        offerPrice: Number(c.offerPrice) || 0,
        savings: c.savings || "",
        tag: c.tag || "SPECIAL OFFER",
        image: c.image || "https://images.unsplash.com/photo-1542838132-92c53300491e",
        items: itemsList,
        isActive: Boolean(c.isActive),
      };
    });

    return NextResponse.json({ combos });
  } catch (error: any) {
    console.warn("Combos public GET error:", error.message);
    return NextResponse.json({ combos: [] }, { status: 500 });
  }
}

