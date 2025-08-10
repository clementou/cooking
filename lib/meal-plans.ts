import { db } from "@/db/client";
import { mealPlanEntries, recipes } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export type MealPlanWithEntries = {
  id: string;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  title: string | null;
  entries: Array<{
    id: string;
    date: string; // YYYY-MM-DD
    mealSlot: "breakfast" | "lunch" | "dinner" | "snack";
    servings: number | null;
    notes: string | null;
    recipe: { id: string; title: string } | null;
  }>;
};

export async function getEntriesInRange(startDate: string, endDate: string) {
  const rows = await db
    .select({
      id: mealPlanEntries.id,
      date: mealPlanEntries.date,
      mealSlot: mealPlanEntries.mealSlot,
      servings: mealPlanEntries.servings,
      notes: mealPlanEntries.notes,
      recipeId: mealPlanEntries.recipeId,
      recipeTitle: recipes.title,
    })
    .from(mealPlanEntries)
    .leftJoin(recipes, eq(mealPlanEntries.recipeId, recipes.id))
    .where(
      and(
        gte(mealPlanEntries.date, startDate),
        lte(mealPlanEntries.date, endDate)
      )
    )
    .orderBy(mealPlanEntries.date);
  return rows;
}

export async function addEntry(params: {
  date: string;
  mealSlot: MealPlanWithEntries["entries"][number]["mealSlot"];
  recipeId?: string | null;
  servings?: number | null;
  notes?: string | null;
}): Promise<string> {
  const [created] = await db
    .insert(mealPlanEntries)
    .values({
      date: params.date,
      mealSlot: params.mealSlot,
      recipeId: params.recipeId ?? null,
      servings: params.servings ?? null,
      notes: params.notes ?? null,
    })
    .returning({ id: mealPlanEntries.id });
  return created.id;
}

export async function updateEntry(
  entryId: string,
  updates: Partial<{
    recipeId: string | null;
    servings: number | null;
    notes: string | null;
  }>
) {
  await db
    .update(mealPlanEntries)
    .set(updates)
    .where(eq(mealPlanEntries.id, entryId));
}

export async function deleteEntry(entryId: string) {
  await db.delete(mealPlanEntries).where(eq(mealPlanEntries.id, entryId));
}
