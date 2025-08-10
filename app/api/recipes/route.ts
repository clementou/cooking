import { db } from "@/db/client";
import {
  instructions,
  recipeIngredients,
  recipeNotes,
  recipeSections,
  recipes,
} from "@/db/schema";
import { recipeSchema } from "@/lib/validation/recipe";
import { ilike } from "drizzle-orm";
import { NextResponse } from "next/server";

type IngredientLine = {
  item: string;
  amount?: number;
  unit?: string;
  notes?: string;
};

function buildRawIngredientText(line: IngredientLine): string {
  const amount = line.amount != null ? String(line.amount) : "";
  const unit = line.unit ? ` ${line.unit}` : "";
  const notes = line.notes ? ` (${line.notes})` : "";
  return `${amount}${unit}${amount || unit ? " " : ""}${
    line.item
  }${notes}`.trim();
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const full = recipeSchema.parse(json);

    // Full transaction
    const createdId = await db.transaction(async (tx) => {
      const [r] = await tx
        .insert(recipes)
        .values({
          title: full.title,
          description: full.description,
          servingsAmount: full.servings.amount,
          timePrep: full.times.prep ?? "",
          timeCook: full.times.cook ?? "",
          timeTotal: full.times.total,
          imageUrl: full.imageUrl,
          cuisine: full.cuisine,
          sourceUrl: full.sourceUrl,
        })
        .returning();

      const recipeId = r.id;

      // Determine ordered section names
      const ingKeys = Object.keys(full.ingredients || {});
      const insKeys = Object.keys(full.instructions || {});
      const sectionOrder: string[] = [...ingKeys];
      for (const k of insKeys)
        if (!sectionOrder.includes(k)) sectionOrder.push(k);

      // Insert sections and create a map name->id
      const sectionIds = new Map<string, string>();
      for (let i = 0; i < sectionOrder.length; i++) {
        const name = sectionOrder[i];
        const [sec] = await tx
          .insert(recipeSections)
          .values({ recipeId, name: name || "Main", orderIndex: i })
          .returning();
        sectionIds.set(name, sec.id);
      }

      // Insert ingredients
      for (const [sectionName, lines] of Object.entries(
        full.ingredients || {}
      )) {
        const sectionId = sectionIds.get(sectionName) ?? null;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          await tx.insert(recipeIngredients).values({
            recipeId,
            sectionId: sectionId ?? undefined,
            rawText: buildRawIngredientText(line),
            quantityNumerator:
              line.amount != null
                ? Math.round(Number(line.amount) * 1000)
                : undefined,
            quantityDenominator: line.amount != null ? 1000 : undefined,
            unit: line.unit,
            notes: line.notes,
            orderIndex: i,
          });
        }
      }

      // Insert instructions
      for (const [sectionName, steps] of Object.entries(
        full.instructions || {}
      )) {
        const sectionId = sectionIds.get(sectionName) ?? null;
        for (const step of steps) {
          await tx.insert(instructions).values({
            recipeId,
            sectionId: sectionId ?? undefined,
            stepNumber: step.step,
            text: step.text,
            notes: step.notes,
          });
        }
      }

      // Insert notes
      for (let i = 0; i < (full.notes?.length ?? 0); i++) {
        await tx.insert(recipeNotes).values({
          recipeId,
          kind: "note",
          text: full.notes![i],
          orderIndex: i,
        });
      }
      for (let i = 0; i < (full.storage?.length ?? 0); i++) {
        await tx.insert(recipeNotes).values({
          recipeId,
          kind: "storage",
          text: full.storage![i],
          orderIndex: i,
        });
      }

      return recipeId;
    });

    return NextResponse.json({ id: createdId }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request", details: (e as Error).message },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Number(searchParams.get("limit") || 20);
  const where = q ? ilike(recipes.title, `%${q}%`) : undefined;
  const query = db
    .select({ id: recipes.id, title: recipes.title })
    .from(recipes)
    .limit(limit);
  
  const rows = where ? await query.where(where) : await query;
  return NextResponse.json({ recipes: rows });
}
