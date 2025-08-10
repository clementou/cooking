import { z } from "zod";

// AI-optimized schema for recipe generation
export const aiIngredientSchema = z.object({
  item: z.string().describe("The name of the ingredient (e.g., 'chicken breast', 'olive oil')"),
  amount: z.number().optional().describe("The numeric amount of the ingredient"),
  unit: z.string().optional().describe("The unit of measurement (e.g., 'cups', 'tablespoons', 'grams')"),
  notes: z.string().optional().describe("Optional preparation notes (e.g., 'diced', 'room temperature')")
});

export const aiInstructionSchema = z.object({
  step: z.number().describe("The step number in the recipe sequence"),
  text: z.string().describe("The detailed instruction for this step"),
  notes: z.string().optional().describe("Optional tips or important notes for this step")
});

export const aiSectionSchema = z.object({
  name: z.string().describe("Section name (e.g., 'Dough', 'Sauce', 'Filling', or 'Main' for unsectioned recipes)"),
  ingredients: z.array(aiIngredientSchema).describe("List of ingredients for this section"),
  instructions: z.array(aiInstructionSchema).describe("List of instructions for this section")
});

export const aiRecipeGenerationSchema = z.object({
  title: z.string().describe("The name of the recipe"),
  description: z.string().describe("A brief, appetizing description of the dish"),
  servings: z.object({
    amount: z.number().describe("Number of servings this recipe makes")
  }),
  times: z.object({
    prep: z.string().describe("Preparation time (e.g., '15 min', '1 hr')"),
    cook: z.string().describe("Cooking time (e.g., '30 min', '2 hr')"),
    total: z.string().describe("Total time from start to finish")
  }),
  cuisine: z.string().optional().describe("The cuisine type (e.g., 'Italian', 'Asian', 'Mexican')"),
  sections: z.array(aiSectionSchema).describe("Recipe sections - use a single 'Main' section for simple recipes, or multiple named sections for complex recipes"),
  notes: z.array(z.string()).optional().describe("Additional tips, variations, or serving suggestions"),
  storage: z.array(z.string()).optional().describe("Storage instructions (e.g., 'Store in refrigerator for up to 3 days')")
});

export type AIGeneratedRecipe = z.infer<typeof aiRecipeGenerationSchema>;

// Transform AI-generated recipe to match the form values format
export function transformAIRecipeToFormValues(aiRecipe: AIGeneratedRecipe) {
  // Parse time strings to value and unit
  const parseTime = (timeStr: string): { value: number; unit: "min" | "hr" } => {
    const match = timeStr.match(/(\d+)\s*(hr?|hours?|min|minutes?)/i);
    if (!match) return { value: 30, unit: "min" };
    
    const value = parseInt(match[1], 10);
    const unitStr = match[2].toLowerCase();
    const unit = unitStr.startsWith("h") ? "hr" : "min";
    
    return { value, unit };
  };

  const prepTime = parseTime(aiRecipe.times.prep);
  const cookTime = parseTime(aiRecipe.times.cook);
  const totalTime = parseTime(aiRecipe.times.total);

  return {
    title: aiRecipe.title,
    description: aiRecipe.description,
    servings: aiRecipe.servings,
    times: {
      total: totalTime,
      breakdown: true,
      prep: prepTime,
      cook: cookTime
    },
    cuisine: aiRecipe.cuisine,
    sections: aiRecipe.sections.map(section => ({
      name: section.name,
      ingredients: section.ingredients,
      steps: section.instructions
    })),
    notes: aiRecipe.notes || [],
    storage: aiRecipe.storage || [],
    imageUrl: undefined,
    sourceUrl: undefined
  };
}

interface FormValues {
  title: string;
  description?: string;
  servings: { amount: number };
  times: {
    total: { value: number; unit: string };
    breakdown?: boolean;
    prep?: { value: number; unit: string };
    cook?: { value: number; unit: string };
  };
  notes: string[];
  storage: string[];
  imageUrl?: string;
  cuisine?: string;
  sourceUrl?: string;
  sections: Array<{
    name?: string;
    ingredients: Array<{ item: string; [key: string]: unknown }>;
    steps: Array<{ text: string; [key: string]: unknown }>;
  }>;
}

// Transform form values to API request format
export function transformToAPIFormat(formValues: FormValues) {
  const ingredients: Record<string, Array<{ item: string; [key: string]: unknown }>> = {};
  const instructions: Record<string, Array<{ text: string; [key: string]: unknown }>> = {};

  for (const section of formValues.sections) {
    const sectionName = section.name || "Main";
    
    if (section.ingredients.length > 0) {
      ingredients[sectionName] = section.ingredients.filter(
        (ing) => ing.item && ing.item.trim() !== ""
      );
    }
    
    if (section.steps.length > 0) {
      instructions[sectionName] = section.steps.filter(
        (step) => step.text && step.text.trim() !== ""
      );
    }
  }

  return {
    title: formValues.title,
    description: formValues.description || "",
    servings: formValues.servings,
    times: {
      total: `${formValues.times.total.value} ${formValues.times.total.unit}`,
      prep: formValues.times.breakdown && formValues.times.prep
        ? `${formValues.times.prep.value} ${formValues.times.prep.unit}`
        : undefined,
      cook: formValues.times.breakdown && formValues.times.cook
        ? `${formValues.times.cook.value} ${formValues.times.cook.unit}`
        : undefined,
    },
    notes: formValues.notes.filter((n) => n && n.trim() !== ""),
    storage: formValues.storage.filter((s) => s && s.trim() !== ""),
    imageUrl: formValues.imageUrl || undefined,
    cuisine: formValues.cuisine || undefined,
    sourceUrl: formValues.sourceUrl || undefined,
    ingredients,
    instructions,
  };
}