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
import {
  transformAIRecipeToFormValues,
  transformToAPIFormat,
} from "@/lib/ai/recipe-schema";
import { AlertCircle, ChefHat, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import RecipeForm, { RecipeEditorValues } from "./recipe-form";

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
    useState<RecipeEditorValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

      const formValues = transformAIRecipeToFormValues(data.recipe);
      setGeneratedRecipe(formValues);
    } catch (error) {
      console.error("Generation error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to generate recipe"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (values: RecipeEditorValues) => {
    setIsSaving(true);
    setError(null);

    try {
      const requestBody = transformToAPIFormat(values);

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save recipe");
      }

      toast.success("Recipe created successfully!");
      router.push(`/recipes/${data.id}`);
    } catch (error) {
      console.error("Save error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save recipe"
      );
      toast.error("Failed to save recipe");
    } finally {
      setIsSaving(false);
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
            <RecipeForm onSubmit={handleSave} defaultValues={generatedRecipe} />
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
