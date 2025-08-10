"use server";

import { db } from "@/db/client";
import {
  recipes
} from "@/db/schema";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function createRecipeAction(formData: FormData) {
  // Minimal manual subset for now; we will expand later.
  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    servingsAmount: formData.get("servingsAmount"),
    timePrep: formData.get("timePrep"),
    timeCook: formData.get("timeCook"),
    timeTotal: formData.get("timeTotal"),
  } as const;

  const parsed = z
    .object({
      title: z.string().min(1),
      description: z.string().min(1),
      servingsAmount: z.coerce.number().int().positive(),
      timePrep: z.string().min(1),
      timeCook: z.string().min(1),
      timeTotal: z.string().min(1),
    })
    .parse(raw);

  await db
    .insert(recipes)
    .values({
      title: parsed.title,
      description: parsed.description,
      servingsAmount: parsed.servingsAmount,
      timePrep: parsed.timePrep,
      timeCook: parsed.timeCook,
      timeTotal: parsed.timeTotal,
    })
    .returning();

  redirect("/recipes");
}
