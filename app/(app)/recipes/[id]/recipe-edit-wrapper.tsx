"use client";

import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Printer, Share2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RecipeEditor } from "@/components/recipes/recipe-editor";
import type { RecipeWithDetails } from "@/lib/recipes";

type RecipeEditorData = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  servingsAmount: number;
  timePrep?: string;
  timeCook?: string;
  timeTotal: string;
  cuisine: string | null;
  sections: Array<{
    id?: string;
    name: string;
    ingredients: Array<{
      id?: string;
      item: string;
      amount?: number;
      unit?: string;
      notes?: string;
    }>;
    instructions: Array<{
      id?: string;
      stepNumber: number;
      text: string;
      notes?: string;
    }>;
  }>;
  notes?: string[];
};

interface RecipeEditWrapperProps {
  recipeId: string;
  recipeTitle: string;
  children: ReactNode;
}

export default function RecipeEditWrapper({ recipeId, recipeTitle, children }: RecipeEditWrapperProps) {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleEdit = async () => {
    // Fetch full recipe data for editing
    const response = await fetch(`/api/recipes/${recipeId}`);
    const recipe: RecipeWithDetails = await response.json();
    
    // Transform for editor
    const editorData = {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      servingsAmount: recipe.servingsAmount,
      timePrep: recipe.timePrep || undefined,
      timeCook: recipe.timeCook || undefined,
      timeTotal: recipe.timeTotal,
      cuisine: recipe.cuisine,
      sections: recipe.sections.map((section) => ({
        id: section.id,
        name: section.name,
        ingredients: section.ingredients.map((ing) => ({
          id: ing.id,
          item: ing.rawText,
          amount: ing.quantityNumerator ?? undefined,
          unit: ing.unit ?? undefined,
          notes: ing.notes ?? undefined
        })),
        instructions: section.instructions.map((inst) => ({
          id: inst.id,
          stepNumber: inst.stepNumber,
          text: inst.text,
          notes: inst.notes ?? undefined
        }))
      })),
      notes: recipe.notes.map((note) => note.text)
    };

    setIsEditMode(true);
    
    // We'll pass this data to the editor via a different method
    // Store it temporarily
    (window as Window & { __recipeEditorData?: RecipeEditorData }).__recipeEditorData = editorData;
  };

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
      ingredients: Array<{ item: string; amount?: number; unit?: string; notes?: string }>;
      instructions: Array<{ text: string; stepNumber: number; notes?: string }>;
    }>;
    notes?: string[];
  }) => {
    try {
      const ingredients: Record<string, Array<{ item: string; amount?: number; unit?: string; notes?: string }>> = {};
      const instructions: Record<string, Array<{ text: string; step: number; notes?: string }>> = {};
      
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
              notes: step.notes
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

      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to update recipe");
      }

      setIsEditMode(false);
      router.refresh();
      toast.success("Recipe updated successfully!");
    } catch (error) {
      console.error("Failed to save recipe:", error);
      toast.error("Failed to save recipe");
      throw error;
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: recipeTitle,
          text: `Check out this recipe: ${recipeTitle}`,
          url: url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Recipe link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy link");
      }
    }
  };

  if (isEditMode && (window as Window & { __recipeEditorData?: RecipeEditorData }).__recipeEditorData) {
    return (
      <RecipeEditor
        initialData={(window as Window & { __recipeEditorData?: RecipeEditorData }).__recipeEditorData}
        mode="edit"
        onSave={handleSave}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/recipes">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Recipes
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleEdit}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={isPrinting}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>
      
      {children}
    </div>
  );
}