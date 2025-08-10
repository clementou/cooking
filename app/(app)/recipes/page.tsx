import { db } from "@/db/client";
import { recipes } from "@/db/schema";
import { desc } from "drizzle-orm";
import RecipesClient from "./recipes-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function RecipesPage() {
  try {
    const rows = await db
      .select()
      .from(recipes)
      .orderBy(desc(recipes.createdAt));

    return <RecipesClient initialRecipes={rows} />;
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    // Return empty state if database is not available
    return <RecipesClient initialRecipes={[]} />;
  }
}