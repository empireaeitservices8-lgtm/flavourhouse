import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query<any[]>(
      "SELECT * FROM recipes WHERE isActive = 1 ORDER BY id DESC"
    );

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
        image: r.image || "/images/pasta.png",
        description: r.description || "",
        ingredients: ingredientsList,
        instructions: instructionsList,
        isActive: Boolean(r.isActive),
      };
    });

    return NextResponse.json({ recipes });
  } catch (error: any) {
    console.warn("Recipes public GET error:", error.message);
    return NextResponse.json({ recipes: [] }, { status: 500 });
  }
}

