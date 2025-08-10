"use client";

import RecipeForm, { RecipeEditorValues } from "@/components/recipes/recipe-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EditRecipeClientWrapperProps {
  recipeId: string;
  initialValues: RecipeEditorValues;
  recipeTitle: string;
}

function buildRecipeRequest(values: RecipeEditorValues) {
  const ingredients: Record<string, Array<{ item: string; [key: string]: unknown }>> = {};
  const instructions: Record<string, Array<{ text: string; [key: string]: unknown }>> = {};

  // Process sections
  for (const section of values.sections) {
    const sectionName = section.name || "Main";
    
    // Add ingredients
    if (section.ingredients.length > 0) {
      ingredients[sectionName] = section.ingredients.filter(
        (ing) => ing.item && ing.item.trim() !== ""
      );
    }
    
    // Add instructions
    if (section.steps.length > 0) {
      instructions[sectionName] = section.steps.filter(
        (step) => step.text && step.text.trim() !== ""
      );
    }
  }

  return {
    title: values.title,
    description: values.description || "",
    servings: values.servings,
    times: {
      total: `${values.times.total.value} ${values.times.total.unit}`,
      prep: values.times.breakdown && values.times.prep
        ? `${values.times.prep.value} ${values.times.prep.unit}`
        : undefined,
      cook: values.times.breakdown && values.times.cook
        ? `${values.times.cook.value} ${values.times.cook.unit}`
        : undefined,
    },
    notes: values.notes.filter((n) => n && n.trim() !== ""),
    storage: values.storage.filter((s) => s && s.trim() !== ""),
    imageUrl: values.imageUrl || undefined,
    cuisine: values.cuisine || undefined,
    sourceUrl: values.sourceUrl || undefined,
    ingredients,
    instructions,
  };
}

export default function EditRecipeClientWrapper({ 
  recipeId, 
  initialValues,
  recipeTitle 
}: EditRecipeClientWrapperProps) {
  const router = useRouter();
  const [, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: RecipeEditorValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const requestBody = buildRecipeRequest(values);
      
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update recipe");
      }

      toast.success("Recipe updated successfully!");
      router.push(`/recipes/${recipeId}`);
    } catch (error) {
      console.error("Failed to update recipe:", error);
      setError(error instanceof Error ? error.message : "Failed to update recipe");
      toast.error("Failed to update recipe");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href={`/recipes/${recipeId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Recipe
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit Recipe: {recipeTitle}
        </h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recipe Details</CardTitle>
        </CardHeader>
        <CardContent>
          <RecipeForm 
            onSubmit={handleSubmit} 
            defaultValues={initialValues}
          />
        </CardContent>
      </Card>
    </div>
  );
}