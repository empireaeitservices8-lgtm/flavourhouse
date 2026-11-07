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

// GET /api/admin/categories
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await query(`
      SELECT c.id, c.name, c.slug, c.description, c.image, c.createdAt,
             COUNT(p.id) as productCount
      FROM categories c
      LEFT JOIN products p ON p.categoryId = c.id
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    return NextResponse.json({
      success: true,
      categories: rows.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        image: cat.image || "",
        productCount: Number(cat.productCount) || 0,
        createdAt: cat.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Admin GET categories error:", error);
    return NextResponse.json({ error: error.message || "Failed to load categories" }, { status: 500 });
  }
}

// POST /api/admin/categories (Create category)
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, image } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if category already exists
    const existing = await query(`SELECT id FROM categories WHERE LOWER(name) = LOWER(?) OR slug = ? LIMIT 1`, [cleanName, slug]);
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ error: "Category with this name or slug already exists" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO categories (name, slug, description, image, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [cleanName, slug, description?.trim() || "", image?.trim() || ""]
    );

    const insertedId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      category: {
        id: insertedId,
        name: cleanName,
        slug,
        description: description?.trim() || "",
        image: image?.trim() || "",
        productCount: 0,
      },
    });
  } catch (error: any) {
    console.error("Admin POST category error:", error);
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}

// PUT /api/admin/categories (Update category)
export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, description, image } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name && name.trim()) {
      const cleanName = name.trim();
      const slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      updates.push("name = ?", "slug = ?");
      params.push(cleanName, slug);
    }

    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description.trim());
    }

    if (image !== undefined) {
      updates.push("image = ?");
      params.push(image.trim());
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updatedAt = NOW()");
    params.push(id);

    await query(`UPDATE categories SET ${updates.join(", ")} WHERE id = ?`, params);

    return NextResponse.json({ success: true, message: "Category updated successfully" });
  } catch (error: any) {
    console.error("Admin PUT category error:", error);
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/admin/categories
export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    // Set products with this categoryId to null so products are not orphaned
    await query(`UPDATE products SET categoryId = NULL WHERE categoryId = ?`, [id]);
    await query(`DELETE FROM categories WHERE id = ?`, [id]);

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("Admin DELETE category error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 500 });
  }
}

