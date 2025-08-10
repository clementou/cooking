import { getEntriesInRange } from "@/lib/meal-plans";
import { notFound } from "next/navigation";
import Link from "next/link";
import MealPlanBoard from "./board-client";

type Params = { params: { id: string } };

function getWeekDays(startISO: string) {
  const start = new Date(startISO + "T00:00:00");
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;

export default async function MealPlanPage({ params }: Params) {
  // use id as encoded week start (YYYY-MM-DD) to align with previous route shape
  const weekStart = params.id;
  const days = getWeekDays(weekStart);
  const rows = await getEntriesInRange(days[0], days[6]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Meal Plan</h1>
        <Link href="/meal-plans" className="text-sm text-muted-foreground hover:underline">All plans</Link>
      </div>
      <MealPlanBoard planId={weekStart} weekDays={days} />
    </div>
  );
}


