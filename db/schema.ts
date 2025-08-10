import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Enums
export const mealSlotEnum = pgEnum("meal_slot", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);
export const sourceTypeEnum = pgEnum("recipe_source", [
  "manual",
  "ai",
  "import",
]);

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  bio: text(),
});

// Recipes core
export const recipes = pgTable("recipes", {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 256 }).notNull(),
  description: text().notNull(),
  imageUrl: text(),
  cuisine: varchar({ length: 128 }),
  servingsAmount: integer().notNull().default(2),
  timePrep: varchar({ length: 64 }).notNull(),
  timeCook: varchar({ length: 64 }).notNull(),
  timeTotal: varchar({ length: 64 }).notNull(),
  sourceType: sourceTypeEnum().notNull().default("manual"),
  sourceUrl: text(),
  createdAt: timestamp({ mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "date" }).defaultNow().notNull(),
});

export const recipeSections = pgTable("recipe_sections", {
  id: uuid().primaryKey().defaultRandom(),
  recipeId: uuid()
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: varchar({ length: 128 }).notNull(), // e.g., "Dough", "Sauce"
  orderIndex: integer().notNull().default(0),
});

export const ingredients = pgTable("ingredients", {
  id: uuid().primaryKey().defaultRandom(),
  baseName: varchar({ length: 256 }).notNull(), // normalized name
  aisle: varchar({ length: 128 }),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: uuid().primaryKey().defaultRandom(),
  recipeId: uuid()
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  sectionId: uuid().references(() => recipeSections.id, {
    onDelete: "set null",
  }),
  ingredientId: uuid().references(() => ingredients.id, {
    onDelete: "set null",
  }),
  rawText: text().notNull(), // keep original line
  quantityNumerator: integer(),
  quantityDenominator: integer(),
  unit: varchar({ length: 64 }),
  preparation: varchar({ length: 128 }),
  notes: varchar({ length: 256 }),
  orderIndex: integer().notNull().default(0),
});

export const instructions = pgTable("instructions", {
  id: uuid().primaryKey().defaultRandom(),
  recipeId: uuid()
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  sectionId: uuid().references(() => recipeSections.id, {
    onDelete: "set null",
  }),
  stepNumber: integer().notNull(),
  text: text().notNull(),
  notes: varchar({ length: 256 }),
});

export const recipeNotes = pgTable("recipe_notes", {
  id: uuid().primaryKey().defaultRandom(),
  recipeId: uuid()
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  kind: varchar({ length: 64 }).notNull().default("note"), // note | storage
  text: text().notNull(),
  orderIndex: integer().notNull().default(0),
});

// Meal planning (stubs for later stages)
export const mealPlanEntries = pgTable("meal_plan_entries", {
  id: uuid().primaryKey().defaultRandom(),
  date: varchar({ length: 10 }).notNull(), // YYYY-MM-DD
  mealSlot: mealSlotEnum().notNull(),
  recipeId: uuid().references(() => recipes.id, { onDelete: "set null" }),
  servings: integer(),
  notes: varchar({ length: 256 }),
});
