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
    const rows = await query(
      `SELECT p.id, p.name, p.slug, p.description, p.image, p.price, p.discountPrice,
              p.stock, p.SKU, p.isActive, p.isFeatured, c.name as category, p.categoryId,
              p.createdAt
       FROM products p
       LEFT JOIN categories c ON p.categoryId = c.id
       WHERE p.id = ?
       LIMIT 1`,
      [id]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      const p = rows[0];
      return NextResponse.json({
        success: true,
        data: {
          ...p,
          price: Number(p.price),
          discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
          stock: p.stock ?? 100,
          isActive: Boolean(p.isActive),
          isFeatured: Boolean(p.isFeatured),
        },
      });
    }

    return NextResponse.json({ error: "Product not found" }, { status: 404 });
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
    const { name, category, price, discountPrice, stock, image, description, isFeatured, isActive, SKU } = body;

    let categoryId = null;
    if (category) {
      const cleanCat = category.trim();
      const catRows = await query(`SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`, [cleanCat]);
      if (Array.isArray(catRows) && catRows.length > 0) {
        categoryId = catRows[0].id;
      } else {
        // Auto-create category in DB if it doesn't exist
        const slug = cleanCat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const newCatRes = await query(
          `INSERT INTO categories (name, slug, description, createdAt, updatedAt) VALUES (?, ?, '', NOW(), NOW())`,
          [cleanCat, slug]
        );
        categoryId = (newCatRes as any).insertId;
      }
    }

    const updates: string[] = [];
    const sqlParams: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      sqlParams.push(name.trim());
    }
    if (description !== undefined) {
      updates.push("description = ?");
      sqlParams.push(description.trim());
    }
    if (image !== undefined) {
      updates.push("image = ?");
      sqlParams.push(image.trim());
    }
    if (categoryId !== null) {
      updates.push("categoryId = ?");
      sqlParams.push(categoryId);
    }
    if (price !== undefined) {
      updates.push("price = ?");
      sqlParams.push(Number(price));
    }
    if (discountPrice !== undefined) {
      updates.push("discountPrice = ?");
      sqlParams.push(discountPrice ? Number(discountPrice) : null);
    }
    if (stock !== undefined) {
      updates.push("stock = ?");
      sqlParams.push(Number(stock));
    }
    if (SKU !== undefined) {
      updates.push("SKU = ?");
      sqlParams.push(SKU.trim());
    }
    if (isActive !== undefined) {
      updates.push("isActive = ?");
      sqlParams.push(isActive ? 1 : 0);
    }
    if (isFeatured !== undefined) {
      updates.push("isFeatured = ?");
      sqlParams.push(isFeatured ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updatedAt = NOW()");
    sqlParams.push(id);

    await query(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, sqlParams);

    return NextResponse.json({ success: true, message: "Product updated successfully" });
  } catch (error: any) {
    console.error("Admin PUT product error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
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
    await query(`DELETE FROM products WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Admin DELETE product error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}

