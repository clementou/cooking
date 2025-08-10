import { getEntriesInRange } from "@/lib/meal-plans";
import { getAllRecipes } from "@/lib/recipes";
import MealPlannerClient from "./meal-planner-client";

// Helper to get Monday of current week
function getCurrentWeekStart(): Date {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Get week range from a starting date
function getWeekRange(startDate: Date) {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  // Parse week from query params or use current week
  const params = await searchParams;
  const weekStart = params.week 
    ? new Date(params.week + 'T00:00:00')
    : getCurrentWeekStart();
    
  const { start, end } = getWeekRange(weekStart);
  
  // Fetch initial data
  const [entries, recipes] = await Promise.all([
    getEntriesInRange(start, end),
    getAllRecipes(),
  ]);

  return (
    <div className="h-full">
      <MealPlannerClient
        initialWeekStart={start}
        initialEntries={entries}
        recipes={recipes}
      />
    </div>
  );
}