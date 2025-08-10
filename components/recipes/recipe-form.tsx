"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import NumberField from "@/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  IngredientLineSchema,
  InstructionStepSchema,
} from "@/lib/validation/recipe";
import { Plus, Trash2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export type SectionEditor = {
  name: string;
  ingredients: z.infer<typeof IngredientLineSchema>[];
  steps: z.infer<typeof InstructionStepSchema>[];
};

export type RecipeEditorValues = {
  title: string;
  description?: string;
  servings: { amount: number };
  times: {
    total: { value: number; unit: "min" | "hr" };
    breakdown?: boolean;
    prep?: { value: number; unit: "min" | "hr" };
    cook?: { value: number; unit: "min" | "hr" };
  };
  notes: string[];
  storage: string[];
  imageUrl?: string;
  cuisine?: string;
  sourceUrl?: string;
  sections: SectionEditor[];
};

type RecipeFormProps = {
  onSubmit: (values: RecipeEditorValues) => void | Promise<void>;
  defaultValues?: Partial<RecipeEditorValues>;
};

function emptyIngredient(): z.infer<typeof IngredientLineSchema> {
  return { item: "", amount: undefined, unit: undefined, notes: undefined };
}

function emptyStep(idx: number): z.infer<typeof InstructionStepSchema> {
  return { step: idx + 1, text: "", notes: undefined };
}

export default function RecipeForm({
  onSubmit,
  defaultValues,
}: RecipeFormProps) {
  const form = useForm<RecipeEditorValues>({
    defaultValues: {
      title: "",
      description: "",
      servings: { amount: 2 },
      times: { total: { value: 45, unit: "min" } },
      notes: [],
      storage: [],
      sections: [
        {
          name: "Main",
          ingredients: [emptyIngredient()],
          steps: [emptyStep(0)],
        },
      ],
      ...defaultValues,
    },
  });

  const addSection = () => {
    const sections = form.getValues("sections");
    form.setValue("sections", [
      ...sections,
      { name: "", ingredients: [emptyIngredient()], steps: [emptyStep(0)] },
    ]);
  };

  const removeSectionAt = (index: number) => {
    const sections = form.getValues("sections");
    form.setValue(
      "sections",
      sections.filter((_, i) => i !== index)
    );
  };

  const sections = form.watch("sections") || [];

  const [step, setStep] = React.useState<1 | 2>(1);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_28rem] gap-8 items-start">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Recipe title"
                        {...field}
                        className="h-12 text-2xl font-semibold tracking-tight placeholder:text-muted-foreground/60"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Short description (optional)"
                        {...field}
                        className="text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-6 items-start">
                <FormField
                  control={form.control}
                  name="servings.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Servings</FormLabel>
                      <FormControl>
                        <NumberField
                          value={field.value as number | undefined}
                          onChange={field.onChange}
                          min={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <div className="text-xs font-medium">Total time</div>
                  <div className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="times.total.value"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="1"
                              placeholder="45"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="times.total.unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="min">min</SelectItem>
                                <SelectItem value="hr">hr</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="times.breakdown"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <input
                          id="breakdown"
                          type="checkbox"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <label
                          htmlFor="breakdown"
                          className="text-sm text-muted-foreground"
                        >
                          Add prep/cook breakdown
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("times.breakdown") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="times.prep.value"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="1"
                                placeholder="15"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="times.prep.unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="min">min</SelectItem>
                                  <SelectItem value="hr">hr</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="times.cook.value"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="1"
                                placeholder="30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="times.cook.unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="min">min</SelectItem>
                                  <SelectItem value="hr">hr</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-2">
                <Button type="button" onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            </div>
            <div className="sticky top-4">
              <div className="aspect-square w-full rounded-md border border-dashed grid place-items-center text-sm text-muted-foreground">
                Image placeholder
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-tight">Sections</h2>
                <Button type="button" variant="outline" onClick={addSection}>
                  <Plus className="mr-2 size-4" /> Add section
                </Button>
              </div>
              <div className="space-y-10">
                {sections.map((_, idx) => {
                  const base = `sections.${idx}` as const;
                  return (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`${base}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Section name"
                                  {...field}
                                  className="font-medium"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSectionAt(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            Ingredients
                          </div>
                          {(form.watch(`${base}.ingredients`) ?? []).map(
                            (__, i) => (
                              <div
                                key={i}
                                className="grid grid-cols-12 gap-2 items-end"
                              >
                                <FormField
                                  control={form.control}
                                  name={
                                    `${base}.ingredients.${i}.amount` as const
                                  }
                                  render={({ field }) => (
                                    <FormItem className="col-span-3">
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="any"
                                          placeholder="Amt"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={
                                    `${base}.ingredients.${i}.unit` as const
                                  }
                                  render={({ field }) => (
                                    <FormItem className="col-span-3">
                                      <FormControl>
                                        <Input placeholder="Unit" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={
                                    `${base}.ingredients.${i}.item` as const
                                  }
                                  render={({ field }) => (
                                    <FormItem className="col-span-5">
                                      <FormControl>
                                        <Input placeholder="Item" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const list =
                                      form.getValues(`${base}.ingredients`) ||
                                      [];
                                    form.setValue(
                                      `${base}.ingredients`,
                                      list.filter((_, j) => j !== i)
                                    );
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                                <FormField
                                  control={form.control}
                                  name={
                                    `${base}.ingredients.${i}.notes` as const
                                  }
                                  render={({ field }) => (
                                    <FormItem className="col-span-12">
                                      <FormControl>
                                        <Input
                                          placeholder="Notes (optional)"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const list =
                                form.getValues(`${base}.ingredients`) || [];
                              form.setValue(`${base}.ingredients`, [
                                ...list,
                                emptyIngredient(),
                              ]);
                            }}
                          >
                            <Plus className="mr-2 size-4" /> Add ingredient
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            Steps
                          </div>
                          {(form.watch(`${base}.steps`) ?? []).map((__, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground w-10">
                                  Step {i + 1}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const list = (
                                      form.getValues(`${base}.steps`) || []
                                    ).filter((_, j) => j !== i);
                                    form.setValue(
                                      `${base}.steps`,
                                      list.map((s, j) => ({
                                        ...s,
                                        step: j + 1,
                                      }))
                                    );
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                              <FormField
                                control={form.control}
                                name={`${base}.steps.${i}.text` as const}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        rows={3}
                                        placeholder="Write the instruction..."
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`${base}.steps.${i}.notes` as const}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder="Notes (optional)"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const list =
                                form.getValues(`${base}.steps`) || [];
                              form.setValue(`${base}.steps`, [
                                ...list,
                                emptyStep(list.length),
                              ]);
                            }}
                          >
                            <Plus className="mr-2 size-4" /> Add step
                          </Button>
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button type="submit">Save recipe</Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
