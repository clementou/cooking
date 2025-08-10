import { getRecipeById } from "@/lib/recipes";
import { notFound } from "next/navigation";
import { RecipeHeader } from "@/components/recipes/recipe-header";
import { RecipeIngredients } from "@/components/recipes/recipe-ingredients";
import { RecipeInstructions } from "@/components/recipes/recipe-instructions";
import { RecipeNotes } from "@/components/recipes/recipe-notes";
import { RecipeActions } from "@/components/recipes/recipe-actions";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const recipe = await getRecipeById(params.id);
  
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

export default async function RecipePage({ params }: { params: { id: string } }) {
  const recipe = await getRecipeById(params.id);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4">
        <RecipeActions recipeId={recipe.id} recipeTitle={recipe.title} />
      </div>
      
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
    </div>
  );
}