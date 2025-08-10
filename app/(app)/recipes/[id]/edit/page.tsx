import { getRecipeById, transformRecipeToFormValues } from "@/lib/recipes";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import EditRecipeClientWrapper from "./client-wrapper";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  
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

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  const formValues = transformRecipeToFormValues(recipe);

  return (
    <EditRecipeClientWrapper 
      recipeId={id} 
      initialValues={formValues}
      recipeTitle={recipe.title}
    />
  );
}