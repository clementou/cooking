"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ChefHat, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RecipeEditor } from "./recipe-editor";

type RecipeEditorData = {
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
};

const EXAMPLE_PROMPTS = [
  "Quick and healthy weeknight dinner for 4 people",
  "Traditional Italian pasta carbonara",
  "Vegan chocolate cake that's moist and delicious",
  "Spicy Thai green curry with vegetables",
  "Classic French onion soup",
  "30-minute chicken stir-fry with vegetables",
];

export default function AiRecipeGenerator() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] =
    useState<RecipeEditorData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a recipe idea or description");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedRecipe(null);

    try {
      const response = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate recipe");
      }

      // Transform AI recipe to match RecipeEditor format
      const aiRecipe = data.recipe;
      const editorData: RecipeEditorData = {
        title: aiRecipe.title,
        description: aiRecipe.description,
        servingsAmount: aiRecipe.servings.amount,
        timePrep: aiRecipe.times.prep || "",
        timeCook: aiRecipe.times.cook || "",
        timeTotal: aiRecipe.times.total,
        cuisine: aiRecipe.cuisine || null,
        imageUrl: null,
        sections: aiRecipe.sections.map(
          (section: {
            name: string;
            ingredients: Array<{
              item: string;
              amount?: number;
              unit?: string;
              notes?: string;
            }>;
            instructions: Array<{ text: string; step: number; notes?: string }>;
          }) => ({
            name: section.name,
            ingredients: section.ingredients.map((ing) => ({
              item: ing.item,
              amount: ing.amount,
              unit: ing.unit,
              notes: ing.notes,
            })),
            instructions: section.instructions.map((inst) => ({
              text: inst.text,
              stepNumber: inst.step,
              notes: inst.notes,
            })),
          })
        ),
        notes: aiRecipe.notes || [],
      };
      setGeneratedRecipe(editorData);
    } catch (error) {
      console.error("Generation error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to generate recipe"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (data: RecipeEditorData) => {
    setError(null);

    try {
      // Build request body for API with AI source type
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
        sourceType: "ai", // Mark as AI-generated
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

      if (!response.ok) {
        throw new Error(result.error || "Failed to save recipe");
      }

      toast.success("AI recipe created successfully!");
      router.push(`/recipes/${result.id}`);
    } catch (error) {
      console.error("Save error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save recipe"
      );
      toast.error("Failed to save recipe");
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  if (generatedRecipe) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Recipe</CardTitle>
                <CardDescription>
                  Review and edit the AI-generated recipe before saving
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedRecipe(null);
                  setPrompt("");
                }}
              >
                Generate Another
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <RecipeEditor
              mode="create"
              onSave={handleSave}
              initialData={generatedRecipe}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Recipe Generator
          </CardTitle>
          <CardDescription>
            Describe the recipe you want to create, and AI will generate a
            complete recipe for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              What recipe would you like to create?
            </label>
            <Textarea
              placeholder="E.g., A healthy chicken dinner for 4 people that takes less than 30 minutes..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isGenerating}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Recipe...
                </>
              ) : (
                <>
                  <ChefHat className="mr-2 h-4 w-4" />
                  Generate Recipe
                </>
              )}
            </Button>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Try these example prompts:
              </p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(example)}
                    disabled={isGenerating}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
