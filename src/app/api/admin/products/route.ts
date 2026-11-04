import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAllStoredProducts,
  getStoredProductById,
  addStoredProduct,
  updateStoredProduct,
  deleteStoredProduct,
  getAllCategories,
} from "@/lib/products-store";

export const dynamic = "force-dynamic";

const TOKEN_VALUE = "flavorhouse_auth_session_token_valid";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("fh_admin_token");
  return Boolean(token && token.value === TOKEN_VALUE);
}

// GET /api/admin/products - List all products and categories
export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = getAllStoredProducts();
  const categories = getAllCategories();
  return NextResponse.json({ products, categories });
}

// POST /api/admin/products - Add a new product
export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, category, price, image, description, inStock } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    if (price === undefined || price === null || isNaN(Number(price))) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    const newProduct = addStoredProduct({
      name,
      category: category || "Pasta",
      price: Number(price),
      image: image || "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81",
      description,
      inStock,
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products - Update a product
export async function PUT(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, category, price, image, description, inStock } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const updated = updateStoredProduct(id, {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(price !== undefined && { price: Number(price) }),
      ...(image !== undefined && { image }),
      ...(description !== undefined && { description }),
      ...(inStock !== undefined && { inStock }),
    });

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products?id=... - Delete a product
export async function DELETE(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const deleted = deleteStoredProduct(id);
    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}

