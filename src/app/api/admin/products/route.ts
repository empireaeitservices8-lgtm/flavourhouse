import { NextResponse } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";
import { PRODUCTS } from "@/lib/data";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const token = getBearerToken(request);
  if (!token) return false;
  const decoded = verifyToken(token);
  return Boolean(decoded && decoded.role === "admin");
}

// GET /api/admin/products
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await query(`
      SELECT p.id, p.name, p.slug, p.description, p.image, p.price, p.discountPrice,
             p.stock, p.SKU, p.isActive, p.isFeatured, c.name as category, p.categoryId,
             p.createdAt
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      ORDER BY p.id DESC
    `);

    const categoriesRows = await query(`SELECT name FROM categories ORDER BY name ASC`);
    const categories = Array.isArray(categoriesRows) ? categoriesRows.map((c: any) => c.name) : ["Pasta", "Vermicelli", "Noodles", "Cookies"];

    return NextResponse.json({
      products: products.map((p: any) => ({
        ...p,
        category: p.category || "Pasta",
        price: Number(p.price),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        stock: p.stock ?? 100,
        inStock: (p.stock ?? 100) > 0,
        isActive: Boolean(p.isActive),
        isFeatured: Boolean(p.isFeatured),
      })),
      categories,
    });
  } catch (error: any) {
    console.warn("DB query failed in admin products GET, using fallback:", error.message);
    return NextResponse.json({
      products: PRODUCTS.map((p) => ({
        ...p,
        stock: 100,
        inStock: true,
        isActive: true,
        isFeatured: false,
        createdAt: new Date().toISOString(),
      })),
      categories: ["Pasta", "Vermicelli", "Noodles", "Cookies"],
    });
  }
}

// POST /api/admin/products (Add new product)
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, category, price, discountPrice, stock, image, description, isFeatured, isActive, SKU } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const cleanPrice = Number(price);
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + "-" + Date.now().toString().slice(-4);

    // Find or Auto-Create Category in MySQL
    let categoryId: number | null = null;
    const catName = (category || "Pasta").trim();
    if (catName) {
      const catRows = await query(`SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`, [catName]);
      if (Array.isArray(catRows) && catRows.length > 0) {
        categoryId = catRows[0].id;
      } else {
        const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const newCat = await query(
          `INSERT INTO categories (name, slug, description, createdAt, updatedAt) VALUES (?, ?, '', NOW(), NOW())`,
          [catName, catSlug]
        );
        categoryId = (newCat as any).insertId;
      }
    }

    const result = await query(
      `INSERT INTO products (name, slug, description, image, categoryId, price, discountPrice, stock, SKU, isActive, isFeatured, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name.trim(),
        slug,
        description || "",
        image || "/images/pasta.png",
        categoryId,
        cleanPrice,
        discountPrice ? Number(discountPrice) : null,
        stock !== undefined ? Number(stock) : 100,
        SKU || `FH-${Date.now().toString().slice(-6)}`,
        isActive !== undefined ? (isActive ? 1 : 0) : 1,
        isFeatured ? 1 : 0,
      ]
    );

    const insertedId = (result as any).insertId;
    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product: { id: insertedId, name: name.trim(), slug, price: cleanPrice, category: catName },
    });
  } catch (error: any) {
    console.error("Admin POST product error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}

// PUT /api/admin/products (Update product)
export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, category, price, discountPrice, stock, image, description, isFeatured, isActive, SKU } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    let categoryId = null;
    if (category) {
      const cleanCat = category.trim();
      const catRows = await query(`SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`, [cleanCat]);
      if (Array.isArray(catRows) && catRows.length > 0) {
        categoryId = catRows[0].id;
      } else {
        const catSlug = cleanCat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const newCat = await query(
          `INSERT INTO categories (name, slug, description, createdAt, updatedAt) VALUES (?, ?, '', NOW(), NOW())`,
          [cleanCat, catSlug]
        );
        categoryId = (newCat as any).insertId;
      }
    }

    await query(
      `UPDATE products SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         image = COALESCE(?, image),
         categoryId = COALESCE(?, categoryId),
         price = COALESCE(?, price),
         discountPrice = ?,
         stock = COALESCE(?, stock),
         SKU = COALESCE(?, SKU),
         isActive = COALESCE(?, isActive),
         isFeatured = COALESCE(?, isFeatured),
         updatedAt = NOW()
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        description !== undefined ? description : null,
        image || null,
        categoryId,
        price !== undefined ? Number(price) : null,
        discountPrice ? Number(discountPrice) : null,
        stock !== undefined ? Number(stock) : null,
        SKU || null,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
        id,
      ]
    );

    return NextResponse.json({ success: true, message: "Product updated successfully" });
  } catch (error: any) {
    console.error("Admin PUT product error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/admin/products (Delete product)
export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await query(`DELETE FROM products WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Admin DELETE product error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
