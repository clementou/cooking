import { getRecipeById, transformRecipeToFormValues } from "@/lib/recipes";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import EditRecipeClientWrapper from "./client-wrapper";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const recipe = await getRecipeById(params.id);
  
  if (!recipe) {
    return {
      title: "Recipe Not Found",
    };
  }

  return {
    title: `Edit ${recipe.title}`,
    description: `Edit recipe: ${recipe.title}`,
  };
}

export default async function EditRecipePage({ params }: { params: { id: string } }) {
  const recipe = await getRecipeById(params.id);

  if (!recipe) {
    notFound();
  }

  const formValues = transformRecipeToFormValues(recipe);

  return (
    <EditRecipeClientWrapper 
      recipeId={params.id} 
      initialValues={formValues}
      recipeTitle={recipe.title}
    />
  );
}