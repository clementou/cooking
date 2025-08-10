"use client";

import AiRecipeGenerator from "@/components/recipes/ai-recipe-generator";
import { RecipeEditor } from "@/components/recipes/recipe-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";

function NewRecipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "manual";

  const handleSave = async (data: {
    title: string;
    description: string;
    servingsAmount: number;
    timePrep?: string;
    timeCook?: string;
    timeTotal: string;
    cuisine?: string | null;
    imageUrl?: string | null;
    sections: Array<{
      name: string;
      ingredients: Array<{
        item: string;
        amount?: number;
        unit?: string;
        notes?: string;
      }>;
      instructions: Array<{ text: string; stepNumber: number; notes?: string }>;
    }>;
    notes?: string[];
  }) => {
    try {
      // Build request body for API
      const ingredients: Record<
        string,
        Array<{ item: string; amount?: number; unit?: string; notes?: string }>
      > = {};
      const instructions: Record<
        string,
        Array<{ text: string; step: number; notes?: string }>
      > = {};

      data.sections.forEach((section) => {
        if (section.ingredients.length > 0) {
          ingredients[section.name] = section.ingredients.filter(
            (ing) => ing.item && ing.item.trim() !== ""
          );
        }

        if (section.instructions.length > 0) {
          instructions[section.name] = section.instructions
            .filter((step) => step.text && step.text.trim() !== "")
            .map((step) => ({
              text: step.text,
              step: step.stepNumber,
              notes: step.notes,
            }));
        }
      });

      const requestBody = {
        title: data.title,
        description: data.description || "",
        servings: { amount: data.servingsAmount },
        times: {
          total: data.timeTotal,
          prep: data.timePrep || "",
          cook: data.timeCook || "",
        },
        notes: data.notes?.filter((n: string) => n && n.trim() !== "") || [],
        imageUrl: data.imageUrl || undefined,
        cuisine: data.cuisine || undefined,
        ingredients,
        instructions,
      };

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log("Create recipe response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to create recipe");
      }

      if (!result.id) {
        console.error("No ID in response:", result);
        throw new Error("No recipe ID returned from server");
      }

      toast.success("Recipe created successfully!");
      router.push(`/recipes/${result.id}`);
    } catch (error) {
      console.error("Failed to create recipe:", error);
      toast.error("Failed to create recipe");
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Recipe</h1>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>
        <TabsContent value="manual" className="pt-4">
          <RecipeEditor mode="create" onSave={handleSave} />
        </TabsContent>
        <TabsContent value="ai" className="pt-4">
          <AiRecipeGenerator />
        </TabsContent>
        <TabsContent value="import" className="pt-4">
          <p className="text-sm text-muted-foreground">
            Import from URL placeholder.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NewRecipePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewRecipeContent />
    </Suspense>
  );
}
