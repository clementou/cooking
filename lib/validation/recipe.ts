import {
  ingredients,
  instructions,
  recipeIngredients,
  recipeNotes,
  recipeSections,
  recipes,
} from "@/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Helper schemas inspired by your previous app
export const ServingSchema = z.object({
  amount: z.number(),
  notes: z.string().optional(),
});

export const TimesSchema = z.object({
  prep: z.string(),
  cook: z.string(),
  total: z.string(),
  marinate: z.string().optional(),
  notes: z.string().optional(),
});

export const IngredientLineSchema = z.object({
  item: z.string(),
  amount: z.coerce.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export const InstructionStepSchema = z.object({
  step: z.number(),
  text: z.string(),
  notes: z.string().optional(),
});

// High-level recipe schema for client forms and AI/import flows
export const recipeSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string(),
  servings: ServingSchema,
  times: TimesSchema,
  // ingredients grouped by section name
  ingredients: z.record(z.string(), z.array(IngredientLineSchema)),
  // instructions grouped by section name
  instructions: z.record(z.string(), z.array(InstructionStepSchema)),
  notes: z.array(z.string()).default([]),
  storage: z.array(z.string()).default([]),
  imageUrl: z.url().optional(),
  cuisine: z.string().optional(),
  sourceUrl: z.url().optional(),
});

// DB-driven schemas (generated from Drizzle)
export const recipeSelectSchema = createSelectSchema(recipes);
export const recipeInsertSchema = createInsertSchema(recipes, {
  // Coerce/validate string durations if needed later
});
export const recipeSectionInsertSchema = createInsertSchema(recipeSections);
export const ingredientInsertSchema = createInsertSchema(ingredients);
export const recipeIngredientInsertSchema =
  createInsertSchema(recipeIngredients);
export const instructionInsertSchema = createInsertSchema(instructions);
export const recipeNoteInsertSchema = createInsertSchema(recipeNotes);

// A mapped structure to translate the high-level recipeSchema into our relational tables
export type NewRecipeInput = z.infer<typeof recipeSchema>;
