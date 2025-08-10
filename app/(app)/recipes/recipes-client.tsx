"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  BookOpen,
  ChefHat,
  Clock,
  Import,
  Search,
  Sparkles,
  Timer,
  Users,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  cuisine: string | null;
  servingsAmount: number;
  timePrep: string;
  timeCook: string;
  timeTotal: string;
  sourceType: "manual" | "ai" | "import";
  createdAt: Date;
  updatedAt: Date;
}

interface RecipesClientProps {
  initialRecipes: Recipe[];
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name", label: "Name (A-Z)" },
  { value: "quickest", label: "Quickest First" },
  { value: "longest", label: "Longest First" },
];

const TIME_FILTERS = [
  { value: "all", label: "All Times" },
  { value: "15", label: "Under 15 min" },
  { value: "30", label: "Under 30 min" },
  { value: "60", label: "Under 1 hour" },
  { value: "120", label: "Under 2 hours" },
];

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+)\s*(hr?|hours?|min|minutes?)/i);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  return unit.startsWith("h") ? value * 60 : value;
}

export default function RecipesClient({ initialRecipes }: RecipesClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [timeFilter, setTimeFilter] = useState("all");
  const [cuisineFilter, setCuisineFilter] = useState("all");

  // Get unique cuisines for filter
  const cuisines = useMemo(() => {
    const uniqueCuisines = new Set<string>();
    initialRecipes.forEach((r) => {
      if (r.cuisine) uniqueCuisines.add(r.cuisine);
    });
    return Array.from(uniqueCuisines).sort();
  }, [initialRecipes]);

  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    let filtered = [...initialRecipes];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.cuisine &&
            r.cuisine.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Time filter
    if (timeFilter !== "all") {
      const maxMinutes = parseInt(timeFilter);
      filtered = filtered.filter((r) => {
        const totalMinutes = parseTimeToMinutes(r.timeTotal);
        return totalMinutes <= maxMinutes && totalMinutes > 0;
      });
    }

    // Cuisine filter
    if (cuisineFilter !== "all") {
      filtered = filtered.filter((r) => r.cuisine === cuisineFilter);
    }

    // Sort
    switch (sortBy) {
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "name":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "quickest":
        filtered.sort(
          (a, b) =>
            parseTimeToMinutes(a.timeTotal) - parseTimeToMinutes(b.timeTotal)
        );
        break;
      case "longest":
        filtered.sort(
          (a, b) =>
            parseTimeToMinutes(b.timeTotal) - parseTimeToMinutes(a.timeTotal)
        );
        break;
      default: // newest
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return filtered;
  }, [initialRecipes, searchQuery, sortBy, timeFilter, cuisineFilter]);

  const getSourceIcon = (sourceType: Recipe["sourceType"]) => {
    switch (sourceType) {
      case "ai":
        return <Sparkles className="w-3 h-3" />;
      case "import":
        return <Import className="w-3 h-3" />;
      default:
        return <ChefHat className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text">My Recipes</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredRecipes.length}{" "}
            {filteredRecipes.length === 1 ? "recipe" : "recipes"} in your
            collection
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] focus:ring-2 focus:ring-orange-500">
              <ArrowUpDown className="w-4 h-4 mr-2 text-orange-600" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[150px] focus:ring-2 focus:ring-orange-500">
              <Timer className="w-4 h-4 mr-2 text-orange-600" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {cuisines.length > 0 && (
            <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
              <SelectTrigger className="w-[150px] focus:ring-2 focus:ring-orange-500">
                <Utensils className="w-4 h-4 mr-2 text-orange-600" />
                <SelectValue placeholder="All Cuisines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cuisines</SelectItem>
                {cuisines.map((cuisine) => (
                  <SelectItem key={cuisine} value={cuisine}>
                    {cuisine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
              <Card className="h-full hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer overflow-hidden group border-orange-100 hover:border-orange-300">
                {/* Image placeholder or actual image */}
                <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden">
                  {recipe.imageUrl ? (
                    <picture>
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    </picture>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-orange-300" />
                    </div>
                  )}
                  {/* Overlay badges */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    {recipe.cuisine && (
                      <Badge
                        variant="secondary"
                        className="bg-white/90 backdrop-blur-sm"
                      >
                        {recipe.cuisine}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="secondary"
                      className="bg-white/90 backdrop-blur-sm gap-1"
                    >
                      {getSourceIcon(recipe.sourceType)}
                      {recipe.sourceType}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                    {recipe.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pb-3">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {recipe.description}
                  </p>
                </CardContent>

                <CardFooter className="pt-0 pb-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{recipe.servingsAmount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{recipe.timeTotal}</span>
                    </div>
                    {recipe.timePrep && (
                      <div className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        <span>Prep: {recipe.timePrep}</span>
                      </div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-orange-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {searchQuery || timeFilter !== "all" || cuisineFilter !== "all"
                  ? "No recipes found"
                  : "Start your recipe collection"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {searchQuery || timeFilter !== "all" || cuisineFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Add your first recipe manually, generate one with AI, or import from your favorite cooking sites"}
              </p>
            </div>
            {!searchQuery &&
              timeFilter === "all" &&
              cuisineFilter === "all" && (
                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => router.push("/recipes/new?tab=manual")}
                    variant="outline"
                  >
                    <ChefHat className="mr-2 h-4 w-4" />
                    Add Manually
                  </Button>
                  <Button onClick={() => router.push("/recipes/new?tab=ai")}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </Button>
                </div>
              )}
          </div>
        </Card>
      )}
    </div>
  );
}
