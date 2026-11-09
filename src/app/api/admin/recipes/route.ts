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
    const rows = await query<any[]>("SELECT * FROM recipes ORDER BY id DESC");
    const recipes = (rows || []).map((r: any) => {
      let ingredientsList: string[] = [];
      let instructionsList: string[] = [];

      if (Array.isArray(r.ingredients)) {
        ingredientsList = r.ingredients;
      } else if (typeof r.ingredients === "string") {
        try {
          ingredientsList = JSON.parse(r.ingredients);
        } catch {
          ingredientsList = r.ingredients.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
        }
      }

      if (Array.isArray(r.instructions)) {
        instructionsList = r.instructions;
      } else if (typeof r.instructions === "string") {
        try {
          instructionsList = JSON.parse(r.instructions);
        } catch {
          instructionsList = r.instructions.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
        }
      }

      return {
        id: r.id,
        title: r.title,
        category: r.category || "Pasta",
        prepTime: r.prepTime || "15 mins",
        cookTime: r.cookTime || "15 mins",
        difficulty: r.difficulty || "Easy",
        servings: r.servings || "2-3",
        image: r.image || "",
        description: r.description || "",
        ingredients: ingredientsList,
        instructions: instructionsList,
        isActive: Boolean(r.isActive),
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({ recipes });
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
      title,
      category = "Pasta",
      prepTime = "15 mins",
      cookTime = "15 mins",
      difficulty = "Easy",
      servings = "2-3",
      image,
      description,
      ingredients,
      instructions,
      isActive = true,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Recipe title is required" }, { status: 400 });
    }

    if (!image || !image.trim()) {
      return NextResponse.json({ error: "Recipe image URL is required" }, { status: 400 });
    }

    let ingredientsJson: string | null = null;
    if (Array.isArray(ingredients)) {
      ingredientsJson = JSON.stringify(ingredients.map((i: any) => String(i).trim()).filter(Boolean));
    } else if (typeof ingredients === "string") {
      const parsed = ingredients.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
      ingredientsJson = JSON.stringify(parsed);
    }

    let instructionsJson: string | null = null;
    if (Array.isArray(instructions)) {
      instructionsJson = JSON.stringify(instructions.map((i: any) => String(i).trim()).filter(Boolean));
    } else if (typeof instructions === "string") {
      const parsed = instructions.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
      instructionsJson = JSON.stringify(parsed);
    }

    const res = await query<any>(
      `INSERT INTO recipes (title, category, prepTime, cookTime, difficulty, servings, image, description, ingredients, instructions, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title.trim(),
        category.trim(),
        prepTime?.trim() || "15 mins",
        cookTime?.trim() || "15 mins",
        difficulty?.trim() || "Easy",
        servings?.trim() || "2-3",
        image.trim(),
        description?.trim() || null,
        ingredientsJson,
        instructionsJson,
        isActive ? 1 : 0,
      ]
    );

    return NextResponse.json({
      success: true,
      recipeId: res.insertId,
      message: "Recipe created successfully!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

