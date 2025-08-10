"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DraggableRecipe } from "./draggable-recipe";
import { DroppableSlot } from "./droppable-slot";
import { ShoppingListModal } from "./shopping-list-modal";

type Recipe = {
  id: string;
  title: string;
  description: string;
  servingsAmount: number;
  timeTotal: string;
};

type MealEntry = {
  id: string;
  date: string;
  mealSlot: "breakfast" | "lunch" | "dinner" | "snack";
  servings: number | null;
  notes: string | null;
  recipeId: string | null;
  recipeTitle: string | null;
};

interface MealPlannerClientProps {
  initialWeekStart: string;
  initialEntries: MealEntry[];
  recipes: Recipe[];
}

const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function MealPlannerClient({
  initialWeekStart,
  initialEntries,
  recipes,
}: MealPlannerClientProps) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [entries, setEntries] = useState<MealEntry[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Calculate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart + "T00:00:00");
    date.setDate(date.getDate() + i);
    return date.toISOString().split("T")[0];
  });

  // Filter recipes based on search
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get entries organized by date and slot
  const entriesByDateSlot = entries.reduce((acc, entry) => {
    const key = `${entry.date}:${entry.mealSlot}`;
    acc[key] = entry;
    return acc;
  }, {} as Record<string, MealEntry>);

  // Navigate weeks
  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(weekStart + "T00:00:00");
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    const newWeekStart = newDate.toISOString().split("T")[0];

    setWeekStart(newWeekStart);
    router.push(`/planner?week=${newWeekStart}`);
    loadWeekData(newWeekStart);
  };

  // Load data for a week
  const loadWeekData = async (weekStartDate: string) => {
    setIsLoading(true);
    try {
      const endDate = new Date(weekStartDate + "T00:00:00");
      endDate.setDate(endDate.getDate() + 6);

      const response = await fetch(
        `/api/meal-plan?start=${weekStartDate}&end=${
          endDate.toISOString().split("T")[0]
        }`
      );

      if (!response.ok) throw new Error("Failed to load meal plan");

      const data = await response.json();
      setEntries(
        data.entries.map(
          (e: {
            id: string;
            date: string;
            mealSlot: string;
            servings?: number;
            notes?: string;
            recipe?: { id: string; title: string };
          }) => ({
            ...e,
            recipeTitle: e.recipe?.title || null,
            recipeId: e.recipe?.id || null,
          })
        )
      );
    } catch (error) {
      console.error("Error loading week data:", error);
      toast.error("Failed to load meal plan");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const recipeId = active.id as string;
    const [date, mealSlot] = (over.id as string).split(":");

    if (!date || !mealSlot) return;

    try {
      const response = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          mealSlot,
          recipeId,
        }),
      });

      if (!response.ok) throw new Error("Failed to update meal plan");

      const { entry } = await response.json();

      // Find the recipe for display
      const recipe = recipes.find((r) => r.id === recipeId);

      // Update local state
      setEntries((prev) => {
        const filtered = prev.filter(
          (e) => !(e.date === date && e.mealSlot === mealSlot)
        );
        return [
          ...filtered,
          {
            ...entry,
            recipeTitle: recipe?.title || null,
          },
        ];
      });

      toast.success("Recipe added to meal plan");
    } catch (error) {
      console.error("Error updating meal plan:", error);
      toast.error("Failed to update meal plan");
    }
  };

  // Remove entry
  const removeEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/meal-plan?id=${entryId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove entry");

      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.success("Recipe removed from meal plan");
    } catch (error) {
      console.error("Error removing entry:", error);
      toast.error("Failed to remove recipe");
    }
  };

  // Format week display
  const formatWeekRange = () => {
    const start = new Date(weekStart + "T00:00:00");
    const end = new Date(weekStart + "T00:00:00");
    end.setDate(end.getDate() + 6);

    const format = (date: Date) =>
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return `${format(start)} - ${format(end)}, ${start.getFullYear()}`;
  };

  const activeRecipe = recipes.find((r) => r.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              <span className="gradient-text">Meal Planner</span>
            </h1>
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              {formatWeekRange()}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <ShoppingListModal currentWeekStart={weekStart} />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek("prev")}
                disabled={isLoading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const day = today.getDay();
                  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                  const monday = new Date(today.setDate(diff));
                  const todayWeek = monday.toISOString().split("T")[0];

                  if (todayWeek !== weekStart) {
                    setWeekStart(todayWeek);
                    router.push(`/planner?week=${todayWeek}`);
                    loadWeekData(todayWeek);
                  }
                }}
                disabled={isLoading}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek("next")}
                disabled={isLoading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Recipe Sidebar */}
          <div className="w-80 flex flex-col space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredRecipes.map((recipe) => (
                <DraggableRecipe key={recipe.id} recipe={recipe} />
              ))}
              {filteredRecipes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recipes found
                </p>
              )}
            </div>
          </div>

          {/* Meal Plan Grid */}
          <Card className="flex-1 overflow-auto">
            <CardContent className="p-0">
              <div className="grid grid-cols-8 min-w-[800px]">
                {/* Header */}
                <div className="p-3 border-b border-r font-medium bg-muted/50"></div>
                {DAYS.map((day, i) => (
                  <div
                    key={day}
                    className="p-3 border-b border-r text-center bg-muted/50"
                  >
                    <div className="font-medium">{day}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(weekDates[i] + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          month: "numeric",
                          day: "numeric",
                        }
                      )}
                    </div>
                  </div>
                ))}

                {/* Meal Slots */}
                {MEAL_SLOTS.map((slot) => (
                  <div key={slot} className="contents">
                    <div className="p-3 border-b border-r font-medium capitalize bg-muted/50">
                      {slot}
                    </div>
                    {weekDates.map((date) => {
                      const entry = entriesByDateSlot[`${date}:${slot}`];
                      return (
                        <DroppableSlot
                          key={`${date}:${slot}`}
                          id={`${date}:${slot}`}
                          entry={entry}
                          onRemove={removeEntry}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DragOverlay>
        {activeId && activeRecipe ? (
          <Card className="w-72 cursor-grabbing shadow-lg">
            <CardContent className="p-3">
              <p className="font-medium text-sm">{activeRecipe.title}</p>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
