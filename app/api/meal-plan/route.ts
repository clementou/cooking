import { db } from "@/db/client";
import { mealPlanEntries, recipes } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealSlot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  recipeId: z.string().uuid(),
  servings: z.number().optional(),
  notes: z.string().optional(),
});

const updateEntrySchema = createEntrySchema.partial();

// GET /api/meal-plan?start=YYYY-MM-DD&end=YYYY-MM-DD
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

    // Fetch meal plan entries with recipe details
    const entries = await db
      .select({
        id: mealPlanEntries.id,
        date: mealPlanEntries.date,
        mealSlot: mealPlanEntries.mealSlot,
        servings: mealPlanEntries.servings,
        notes: mealPlanEntries.notes,
        recipe: {
          id: recipes.id,
          title: recipes.title,
          description: recipes.description,
          servingsAmount: recipes.servingsAmount,
          timeTotal: recipes.timeTotal,
        },
      })
      .from(mealPlanEntries)
      .leftJoin(recipes, eq(mealPlanEntries.recipeId, recipes.id))
      .where(
        and(
          gte(mealPlanEntries.date, start),
          lte(mealPlanEntries.date, end)
        )
      )
      .orderBy(mealPlanEntries.date, mealPlanEntries.mealSlot);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Failed to fetch meal plan entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal plan entries" },
      { status: 500 }
    );
  }
}

// POST /api/meal-plan - Create a new meal plan entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createEntrySchema.parse(body);

    // Check if entry already exists for this date/slot
    const existing = await db
      .select()
      .from(mealPlanEntries)
      .where(
        and(
          eq(mealPlanEntries.date, data.date),
          eq(mealPlanEntries.mealSlot, data.mealSlot)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing entry
      const [updated] = await db
        .update(mealPlanEntries)
        .set({
          recipeId: data.recipeId,
          servings: data.servings,
          notes: data.notes,
        })
        .where(eq(mealPlanEntries.id, existing[0].id))
        .returning();

      return NextResponse.json({ entry: updated });
    } else {
      // Create new entry
      const [created] = await db
        .insert(mealPlanEntries)
        .values(data)
        .returning();

      return NextResponse.json({ entry: created }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create meal plan entry:", error);
    return NextResponse.json(
      { error: "Failed to create meal plan entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/meal-plan?id=uuid
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(mealPlanEntries)
      .where(eq(mealPlanEntries.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete meal plan entry:", error);
    return NextResponse.json(
      { error: "Failed to delete meal plan entry" },
      { status: 500 }
    );
  }
}