import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const token = getBearerToken(request);
  if (!token) return false;
  const decoded = verifyToken(token);
  return Boolean(decoded && decoded.role === "admin");
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await query<any[]>("SELECT * FROM combo_offers ORDER BY id DESC");
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
        id: c.id,
        name: c.name,
        subtitle: c.subtitle || "",
        description: c.description || "",
        originalPrice: Number(c.originalPrice) || 0,
        offerPrice: Number(c.offerPrice) || 0,
        savings: c.savings || "",
        tag: c.tag || "",
        image: c.image || "",
        items: itemsList,
        isActive: Boolean(c.isActive),
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({ combos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      subtitle,
      description,
      originalPrice,
      offerPrice,
      savings,
      tag,
      image,
      items,
      isActive = true,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Combo offer name is required" }, { status: 400 });
    }

    if (!image || !image.trim()) {
      return NextResponse.json({ error: "Combo image URL is required" }, { status: 400 });
    }

    const orig = Number(originalPrice) || 0;
    const offer = Number(offerPrice) || orig || 0;

    let itemsJson: string | null = null;
    if (Array.isArray(items)) {
      itemsJson = JSON.stringify(items.map((i: any) => String(i).trim()).filter(Boolean));
    } else if (typeof items === "string") {
      const parsed = items.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
      itemsJson = JSON.stringify(parsed);
    }

    let calculatedSavings = savings ? String(savings).trim() : "";
    if (!calculatedSavings && orig > offer && orig > 0) {
      const pct = Math.round(((orig - offer) / orig) * 100);
      calculatedSavings = `${pct}% OFF`;
    }

    const res = await query<any>(
      `INSERT INTO combo_offers (name, subtitle, description, originalPrice, offerPrice, savings, tag, image, items, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name.trim(),
        subtitle?.trim() || null,
        description?.trim() || null,
        orig,
        offer,
        calculatedSavings || null,
        tag?.trim() || null,
        image.trim(),
        itemsJson,
        isActive ? 1 : 0,
      ]
    );

    return NextResponse.json({
      success: true,
      comboId: res.insertId,
      message: "Combo offer created successfully!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

