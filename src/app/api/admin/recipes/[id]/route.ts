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
      title,
      category,
      prepTime,
      cookTime,
      difficulty,
      servings,
      image,
      description,
      ingredients,
      instructions,
      isActive,
    } = body;

    const existing = await query<any[]>("SELECT id FROM recipes WHERE id = ? LIMIT 1", [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    let ingredientsJson: string | null = null;
    if (ingredients !== undefined) {
      if (Array.isArray(ingredients)) {
        ingredientsJson = JSON.stringify(ingredients.map((i: any) => String(i).trim()).filter(Boolean));
      } else if (typeof ingredients === "string") {
        const parsed = ingredients.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
        ingredientsJson = JSON.stringify(parsed);
      }
    }

    let instructionsJson: string | null = null;
    if (instructions !== undefined) {
      if (Array.isArray(instructions)) {
        instructionsJson = JSON.stringify(instructions.map((i: any) => String(i).trim()).filter(Boolean));
      } else if (typeof instructions === "string") {
        const parsed = instructions.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
        instructionsJson = JSON.stringify(parsed);
      }
    }

    await query(
      `UPDATE recipes SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        prepTime = COALESCE(?, prepTime),
        cookTime = COALESCE(?, cookTime),
        difficulty = COALESCE(?, difficulty),
        servings = COALESCE(?, servings),
        image = COALESCE(?, image),
        description = ?,
        ingredients = COALESCE(?, ingredients),
        instructions = COALESCE(?, instructions),
        isActive = COALESCE(?, isActive),
        updatedAt = NOW()
      WHERE id = ?`,
      [
        title?.trim() || null,
        category?.trim() || null,
        prepTime?.trim() || null,
        cookTime?.trim() || null,
        difficulty?.trim() || null,
        servings?.trim() || null,
        image?.trim() || null,
        description !== undefined ? description?.trim() || null : null,
        ingredientsJson,
        instructionsJson,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        id,
      ]
    );

    return NextResponse.json({ success: true, message: "Recipe updated successfully!" });
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
    await query("DELETE FROM recipes WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Recipe deleted successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

