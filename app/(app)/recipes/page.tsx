import { db } from "@/db/client";
import { recipes } from "@/db/schema";
import { desc } from "drizzle-orm";
import RecipesClient from "./recipes-client";

export default async function RecipesPage() {
  const rows = await db
    .select()
    .from(recipes)
    .orderBy(desc(recipes.createdAt));

  return <RecipesClient initialRecipes={rows} />;
}