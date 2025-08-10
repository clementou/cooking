"use client";

import RecipeForm, {
  type RecipeEditorValues,
} from "@/components/recipes/recipe-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewRecipeClientWrapper() {
  const router = useRouter();
  return (
    <RecipeForm
      onSubmit={async (values: RecipeEditorValues) => {
        const res = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: values.title,
            description: values.description ?? "",
            servings: { amount: values.servings.amount },
            times: {
              total: `${values.times.total.value} ${values.times.total.unit}`,
              prep:
                values.times.breakdown && values.times.prep
                  ? `${values.times.prep.value} ${values.times.prep.unit}`
                  : "",
              cook:
                values.times.breakdown && values.times.cook
                  ? `${values.times.cook.value} ${values.times.cook.unit}`
                  : "",
            },
            ingredients: Object.fromEntries(
              values.sections.map((s) => [s.name || "Section", s.ingredients])
            ),
            instructions: Object.fromEntries(
              values.sections.map((s) => [s.name || "Section", s.steps])
            ),
            notes: values.notes ?? [],
            storage: values.storage ?? [],
            imageUrl: values.imageUrl,
            cuisine: values.cuisine,
            sourceUrl: values.sourceUrl,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err?.error ?? "Failed to create recipe");
          return;
        }
        toast.success("Recipe created");
        router.push("/recipes");
      }}
    />
  );
}
