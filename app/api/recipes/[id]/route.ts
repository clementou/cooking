import { db } from "@/db/client";
import {
  instructions,
  recipeIngredients,
  recipeNotes,
  recipeSections,
  recipes,
} from "@/db/schema";
import { recipeSchema } from "@/lib/validation/recipe";
import { eq } from "drizzle-orm";
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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, params.id))
      .limit(1);

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Failed to fetch recipe:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await req.json();
    const full = recipeSchema.parse(json);

    // Check if recipe exists
    const [existing] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Update in transaction (delete and recreate related data)
    await db.transaction(async (tx) => {
      // Update main recipe
      await tx
        .update(recipes)
        .set({
          title: full.title,
          description: full.description,
          servingsAmount: full.servings.amount,
          timePrep: full.times.prep ?? "",
          timeCook: full.times.cook ?? "",
          timeTotal: full.times.total,
          imageUrl: full.imageUrl,
          cuisine: full.cuisine,
          sourceUrl: full.sourceUrl,
          updatedAt: new Date(),
        })
        .where(eq(recipes.id, params.id));

      // Delete existing related data
      await tx.delete(recipeSections).where(eq(recipeSections.recipeId, params.id));
      await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, params.id));
      await tx.delete(instructions).where(eq(instructions.recipeId, params.id));
      await tx.delete(recipeNotes).where(eq(recipeNotes.recipeId, params.id));

      // Re-insert sections
      const sectionIds = new Map<string | null, string>();
      const allSectionNames = new Set<string>();

      // Collect all section names
      for (const [sectionName] of Object.entries(full.ingredients || {})) {
        if (sectionName !== "Main") {
          allSectionNames.add(sectionName);
        }
      }
      for (const [sectionName] of Object.entries(full.instructions || {})) {
        if (sectionName !== "Main") {
          allSectionNames.add(sectionName);
        }
      }

      // Create sections
      let sectionOrderIndex = 0;
      for (const sectionName of allSectionNames) {
        const [section] = await tx
          .insert(recipeSections)
          .values({
            recipeId: params.id,
            name: sectionName,
            orderIndex: sectionOrderIndex++,
          })
          .returning();
        sectionIds.set(sectionName, section.id);
      }

      // Insert ingredients
      for (const [sectionName, lines] of Object.entries(
        full.ingredients || {}
      )) {
        const sectionId = sectionIds.get(sectionName) ?? null;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          await tx.insert(recipeIngredients).values({
            recipeId: params.id,
            sectionId: sectionId ?? undefined,
            rawText: buildRawIngredientText(line),
            quantityNumerator:
              line.amount != null
                ? Math.round(Number(line.amount) * 1000)
                : undefined,
            quantityDenominator: line.amount != null ? 1000 : undefined,
            unit: line.unit,
            notes: line.notes,
            preparation: undefined,
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
            recipeId: params.id,
            sectionId: sectionId ?? undefined,
            stepNumber: step.step,
            text: step.text,
            notes: step.notes,
          });
        }
      }

      // Insert notes
      let noteOrderIndex = 0;
      for (const text of full.notes || []) {
        await tx.insert(recipeNotes).values({
          recipeId: params.id,
          kind: "note",
          text,
          orderIndex: noteOrderIndex++,
        });
      }

      for (const text of full.storage || []) {
        await tx.insert(recipeNotes).values({
          recipeId: params.id,
          kind: "storage",
          text,
          orderIndex: noteOrderIndex++,
        });
      }
    });

    return NextResponse.json({ success: true, id: params.id });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed to update recipe:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db
      .delete(recipes)
      .where(eq(recipes.id, params.id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}