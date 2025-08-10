import { RecipeHeader } from "@/components/recipes/recipe-header";
import { RecipeIngredients } from "@/components/recipes/recipe-ingredients";
import { RecipeInstructions } from "@/components/recipes/recipe-instructions";
import { RecipeNotes } from "@/components/recipes/recipe-notes";
import { getRecipeById } from "@/lib/recipes";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import RecipeEditWrapper from "./recipe-edit-wrapper";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    return {
      title: "Recipe Not Found",
    };
  }

  return {
    title: recipe.title,
    description: recipe.description,
  };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  return (
    <RecipeEditWrapper recipeId={recipe.id} recipeTitle={recipe.title}>
      <RecipeHeader
        title={recipe.title}
        description={recipe.description}
        imageUrl={recipe.imageUrl}
        servingsAmount={recipe.servingsAmount}
        timePrep={recipe.timePrep}
        timeCook={recipe.timeCook}
        timeTotal={recipe.timeTotal}
        cuisine={recipe.cuisine}
      />

      <div className="grid gap-8 md:grid-cols-3 mt-8">
        <div className="md:col-span-1">
          <RecipeIngredients
            sections={recipe.sections}
            unsectionedIngredients={recipe.unsectionedIngredients}
          />
        </div>

        <div className="md:col-span-2">
          <RecipeInstructions
            sections={recipe.sections}
            unsectionedInstructions={recipe.unsectionedInstructions}
          />
        </div>
      </div>

      {recipe.notes.length > 0 && (
        <div className="mt-8">
          <RecipeNotes notes={recipe.notes} />
        </div>
      )}
    </RecipeEditWrapper>
  );
}
