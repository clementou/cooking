import { db } from "@/db/client";
import { mealPlanEntries, recipes, recipeIngredients } from "@/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/shopping-list?start=YYYY-MM-DD&end=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

    // Get all meal plan entries in date range
    const entries = await db
      .select({
        recipeId: mealPlanEntries.recipeId,
        servings: mealPlanEntries.servings,
        recipeName: recipes.title,
        recipeServings: recipes.servingsAmount,
      })
      .from(mealPlanEntries)
      .innerJoin(recipes, eq(mealPlanEntries.recipeId, recipes.id))
      .where(
        and(
          gte(mealPlanEntries.date, start),
          lte(mealPlanEntries.date, end)
        )
      );

    if (entries.length === 0) {
      return NextResponse.json({ 
        ingredients: [],
        recipes: [],
        dateRange: { start, end }
      });
    }

    // Get unique recipe IDs and their total servings needed
    const recipeServingsMap = new Map<string, { title: string; totalServings: number; baseServings: number }>();
    
    for (const entry of entries) {
      if (!entry.recipeId) continue;
      
      const existing = recipeServingsMap.get(entry.recipeId);
      const servingsToAdd = entry.servings || entry.recipeServings;
      
      if (existing) {
        existing.totalServings += servingsToAdd;
      } else {
        recipeServingsMap.set(entry.recipeId, {
          title: entry.recipeName,
          totalServings: servingsToAdd,
          baseServings: entry.recipeServings,
        });
      }
    }

    // Get all ingredients for these recipes
    const recipeIds = Array.from(recipeServingsMap.keys());
    const ingredients = await db
      .select({
        recipeId: recipeIngredients.recipeId,
        rawText: recipeIngredients.rawText,
        quantityNumerator: recipeIngredients.quantityNumerator,
        quantityDenominator: recipeIngredients.quantityDenominator,
        unit: recipeIngredients.unit,
      })
      .from(recipeIngredients)
      .where(sql`${recipeIngredients.recipeId} IN ${recipeIds}`);

    // Aggregate ingredients
    const shoppingList: Array<{
      ingredient: string;
      recipes: string[];
    }> = [];
    
    const ingredientMap = new Map<string, Set<string>>();
    
    for (const ing of ingredients) {
      if (!ing.recipeId) continue;
      
      const recipeInfo = recipeServingsMap.get(ing.recipeId);
      if (!recipeInfo) continue;
      
      // Calculate scaled quantity based on servings
      const scaleFactor = recipeInfo.totalServings / recipeInfo.baseServings;
      let displayText = ing.rawText;
      
      if (ing.quantityNumerator && ing.quantityDenominator) {
        const originalQty = ing.quantityNumerator / ing.quantityDenominator;
        const scaledQty = originalQty * scaleFactor;
        
        // Simple formatting - could be improved
        const formattedQty = scaledQty % 1 === 0 
          ? scaledQty.toString() 
          : scaledQty.toFixed(2);
          
        displayText = `${formattedQty}${ing.unit ? ' ' + ing.unit : ''} ${ing.rawText.replace(/^\d+(\.\d+)?\s*\w*\s*/, '')}`;
      }
      
      // Group by ingredient text for now (could be improved with ingredient normalization)
      const existing = ingredientMap.get(displayText);
      if (existing) {
        existing.add(recipeInfo.title);
      } else {
        ingredientMap.set(displayText, new Set([recipeInfo.title]));
      }
    }
    
    // Convert to array format
    for (const [ingredient, recipeSet] of ingredientMap.entries()) {
      shoppingList.push({
        ingredient,
        recipes: Array.from(recipeSet),
      });
    }
    
    // Sort alphabetically
    shoppingList.sort((a, b) => a.ingredient.localeCompare(b.ingredient));

    return NextResponse.json({
      ingredients: shoppingList,
      recipes: Array.from(recipeServingsMap.values()),
      dateRange: { start, end },
    });
  } catch (error) {
    console.error("Failed to generate shopping list:", error);
    return NextResponse.json(
      { error: "Failed to generate shopping list" },
      { status: 500 }
    );
  }
}