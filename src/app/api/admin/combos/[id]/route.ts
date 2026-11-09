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

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
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
      isActive,
    } = body;

    const existing = await query<any[]>("SELECT id FROM combo_offers WHERE id = ? LIMIT 1", [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Combo offer not found" }, { status: 404 });
    }

    const orig = Number(originalPrice) || 0;
    const offer = Number(offerPrice) || orig || 0;

    let itemsJson: string | null = null;
    if (items !== undefined) {
      if (Array.isArray(items)) {
        itemsJson = JSON.stringify(items.map((i: any) => String(i).trim()).filter(Boolean));
      } else if (typeof items === "string") {
        const parsed = items.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
        itemsJson = JSON.stringify(parsed);
      }
    }

    let calculatedSavings = savings ? String(savings).trim() : "";
    if (!calculatedSavings && orig > offer && orig > 0) {
      const pct = Math.round(((orig - offer) / orig) * 100);
      calculatedSavings = `${pct}% OFF`;
    }

    await query(
      `UPDATE combo_offers SET
        name = COALESCE(?, name),
        subtitle = ?,
        description = ?,
        originalPrice = ?,
        offerPrice = ?,
        savings = ?,
        tag = ?,
        image = COALESCE(?, image),
        items = COALESCE(?, items),
        isActive = COALESCE(?, isActive),
        updatedAt = NOW()
      WHERE id = ?`,
      [
        name?.trim() || null,
        subtitle !== undefined ? subtitle?.trim() || null : null,
        description !== undefined ? description?.trim() || null : null,
        orig,
        offer,
        calculatedSavings || null,
        tag !== undefined ? tag?.trim() || null : null,
        image?.trim() || null,
        itemsJson,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        id,
      ]
    );

    return NextResponse.json({ success: true, message: "Combo offer updated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await query("DELETE FROM combo_offers WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Combo offer deleted successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

