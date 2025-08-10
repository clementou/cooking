import { db } from "@/db/client";
import {
  instructions,
  recipeIngredients,
  recipeNotes,
  recipes,
  recipeSections,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import type { RecipeEditorValues } from "@/components/recipes/recipe-form";

export interface RecipeWithDetails {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  servingsAmount: number;
  timePrep: string;
  timeCook: string;
  timeTotal: string;
  cuisine: string | null;
  sourceType: "manual" | "ai" | "import";
  sourceUrl: string | null;
  sections: Array<{
    id: string;
    name: string;
    orderIndex: number;
    ingredients: Array<{
      id: string;
      rawText: string;
      quantityNumerator: number | null;
      quantityDenominator: number | null;
      unit: string | null;
      preparation: string | null;
      notes: string | null;
      orderIndex: number;
    }>;
    instructions: Array<{
      id: string;
      stepNumber: number;
      text: string;
      notes: string | null;
    }>;
  }>;
  unsectionedIngredients: Array<{
    id: string;
    rawText: string;
    quantityNumerator: number | null;
    quantityDenominator: number | null;
    unit: string | null;
    preparation: string | null;
    notes: string | null;
    orderIndex: number;
  }>;
  unsectionedInstructions: Array<{
    id: string;
    stepNumber: number;
    text: string;
    notes: string | null;
  }>;
  notes: Array<{
    id: string;
    kind: string;
    text: string;
    orderIndex: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export async function getRecipeById(
  id: string
): Promise<RecipeWithDetails | null> {
  const [recipeResult] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);

  if (!recipeResult) {
    return null;
  }

  const [sectionsResult, ingredientsResult, instructionsResult, notesResult] =
    await Promise.all([
      db
        .select()
        .from(recipeSections)
        .where(eq(recipeSections.recipeId, id))
        .orderBy(recipeSections.orderIndex),
      db
        .select()
        .from(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, id))
        .orderBy(recipeIngredients.orderIndex),
      db
        .select()
        .from(instructions)
        .where(eq(instructions.recipeId, id))
        .orderBy(instructions.stepNumber),
      db
        .select()
        .from(recipeNotes)
        .where(eq(recipeNotes.recipeId, id))
        .orderBy(recipeNotes.orderIndex),
    ]);

  const sectionMap = new Map(
    sectionsResult.map((s) => [
      s.id,
      {
        ...s,
        ingredients: [] as typeof ingredientsResult,
        instructions: [] as typeof instructionsResult,
      },
    ])
  );

  const unsectionedIngredients: typeof ingredientsResult = [];
  const unsectionedInstructions: typeof instructionsResult = [];

  for (const ingredient of ingredientsResult) {
    if (ingredient.sectionId && sectionMap.has(ingredient.sectionId)) {
      sectionMap.get(ingredient.sectionId)!.ingredients.push(ingredient);
    } else {
      unsectionedIngredients.push(ingredient);
    }
  }

  for (const instruction of instructionsResult) {
    if (instruction.sectionId && sectionMap.has(instruction.sectionId)) {
      sectionMap.get(instruction.sectionId)!.instructions.push(instruction);
    } else {
      unsectionedInstructions.push(instruction);
    }
  }

  return {
    ...recipeResult,
    sections: Array.from(sectionMap.values()),
    unsectionedIngredients,
    unsectionedInstructions,
    notes: notesResult,
  };
}

export async function getAllRecipes() {
  return await db.select().from(recipes).orderBy(desc(recipes.createdAt));
}

function parseTimeString(timeStr: string): { value: number; unit: "min" | "hr" } {
  const match = timeStr.match(/(\d+)\s*(hr?|hours?|min|minutes?)/i);
  if (!match) {
    return { value: 0, unit: "min" };
  }
  
  const value = parseInt(match[1], 10);
  const unitStr = match[2].toLowerCase();
  const unit = unitStr.startsWith("h") ? "hr" : "min";
  
  return { value, unit };
}

export function transformRecipeToFormValues(recipe: RecipeWithDetails): RecipeEditorValues {
  const sectionMap = new Map<string, {
    ingredients: Array<{ item: string; amount?: number; unit?: string; notes?: string }>;
    steps: Array<{ step: number; text: string; notes?: string }>;
  }>();

  // Initialize sections
  for (const section of recipe.sections) {
    sectionMap.set(section.name, {
      ingredients: [],
      steps: [],
    });
  }

  // Add a "Main" section for unsectioned items if needed
  if (recipe.unsectionedIngredients.length > 0 || recipe.unsectionedInstructions.length > 0) {
    sectionMap.set("Main", {
      ingredients: [],
      steps: [],
    });
  }

  // Process sectioned ingredients
  for (const section of recipe.sections) {
    const sectionData = sectionMap.get(section.name)!;
    for (const ingredient of section.ingredients) {
      const parsed = parseIngredientText(ingredient.rawText);
      sectionData.ingredients.push(parsed);
    }
    
    for (const instruction of section.instructions) {
      sectionData.steps.push({
        step: instruction.stepNumber,
        text: instruction.text,
        notes: instruction.notes || undefined,
      });
    }
  }

  // Process unsectioned ingredients
  if (recipe.unsectionedIngredients.length > 0) {
    const mainSection = sectionMap.get("Main")!;
    for (const ingredient of recipe.unsectionedIngredients) {
      const parsed = parseIngredientText(ingredient.rawText);
      mainSection.ingredients.push(parsed);
    }
  }

  // Process unsectioned instructions
  if (recipe.unsectionedInstructions.length > 0) {
    const mainSection = sectionMap.get("Main")!;
    for (const instruction of recipe.unsectionedInstructions) {
      mainSection.steps.push({
        step: instruction.stepNumber,
        text: instruction.text,
        notes: instruction.notes || undefined,
      });
    }
  }

  // Transform sections to array format
  const sections = Array.from(sectionMap.entries()).map(([name, data]) => ({
    name,
    ingredients: data.ingredients,
    steps: data.steps.sort((a, b) => a.step - b.step),
  }));

  // Parse notes
  const notes: string[] = [];
  const storage: string[] = [];
  
  for (const note of recipe.notes) {
    if (note.kind === "storage") {
      storage.push(note.text);
    } else {
      notes.push(note.text);
    }
  }

  // Parse times
  const prepTime = parseTimeString(recipe.timePrep);
  const cookTime = parseTimeString(recipe.timeCook);
  const totalTime = parseTimeString(recipe.timeTotal);
  
  const hasBreakdown = recipe.timePrep !== "" || recipe.timeCook !== "";

  return {
    title: recipe.title,
    description: recipe.description || "",
    servings: { amount: recipe.servingsAmount },
    times: {
      total: totalTime,
      breakdown: hasBreakdown,
      prep: hasBreakdown ? prepTime : undefined,
      cook: hasBreakdown ? cookTime : undefined,
    },
    notes,
    storage,
    imageUrl: recipe.imageUrl || undefined,
    cuisine: recipe.cuisine || undefined,
    sourceUrl: recipe.sourceUrl || undefined,
    sections: sections.length > 0 ? sections : [{
      name: "Main",
      ingredients: [{ item: "", amount: undefined, unit: undefined, notes: undefined }],
      steps: [{ step: 1, text: "", notes: undefined }],
    }],
  };
}

function parseIngredientText(rawText: string): { 
  item: string; 
  amount?: number; 
  unit?: string; 
  notes?: string;
} {
  // Basic parsing - can be improved
  const match = rawText.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+?)(?:\s*\(([^)]+)\))?$/);
  
  if (match) {
    return {
      amount: parseFloat(match[1]),
      unit: match[2] || undefined,
      item: match[3],
      notes: match[4] || undefined,
    };
  }
  
  // If no amount/unit pattern found, treat whole thing as item
  const notesMatch = rawText.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (notesMatch) {
    return {
      item: notesMatch[1],
      notes: notesMatch[2],
    };
  }
  
  return { item: rawText };
}
