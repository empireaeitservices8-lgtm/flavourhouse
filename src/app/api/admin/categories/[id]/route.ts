import { NextResponse } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const token = getBearerToken(request);
  if (!token) return false;
  const decoded = verifyToken(token);
  return Boolean(decoded && decoded.role === "admin");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const rows = await query(`SELECT * FROM categories WHERE id = ? LIMIT 1`, [id]);
    if (Array.isArray(rows) && rows.length > 0) {
      return NextResponse.json({ success: true, category: rows[0] });
    }
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, image } = body;

    const updates: string[] = [];
    const sqlParams: any[] = [];

    if (name && name.trim()) {
      const cleanName = name.trim();
      const slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      updates.push("name = ?", "slug = ?");
      sqlParams.push(cleanName, slug);
    }

    if (description !== undefined) {
      updates.push("description = ?");
      sqlParams.push(description.trim());
    }

    if (image !== undefined) {
      updates.push("image = ?");
      sqlParams.push(image.trim());
    }

    if (updates.length > 0) {
      updates.push("updatedAt = NOW()");
      sqlParams.push(id);
      await query(`UPDATE categories SET ${updates.join(", ")} WHERE id = ?`, sqlParams);
    }

    return NextResponse.json({ success: true, message: "Category updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await query(`UPDATE products SET categoryId = NULL WHERE categoryId = ?`, [id]);
    await query(`DELETE FROM categories WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

