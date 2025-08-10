"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import {
  BookOpen,
  Calendar,
  ChefHat,
  Import,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isRecipes = pathname.startsWith("/recipes");
  const isPlanner = pathname.startsWith("/planner");

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/recipes" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 text-white group-hover:scale-110 transition-transform">
              <ChefHat className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block">
              Cookbook
            </span>
          </Link>

          {/* Center Navigation */}
          <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center bg-gray-100 rounded-full p-1">
              <Link href="/recipes">
                <button
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-medium transition-all",
                    isRecipes
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  Recipes
                </button>
              </Link>
              <Link href="/planner">
                <button
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-medium transition-all",
                    isPlanner
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  Planner
                </button>
              </Link>
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">New Recipe</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Create a recipe</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/recipes/new?tab=manual")}
                  className="cursor-pointer"
                >
                  <BookOpen className="mr-2 h-4 w-4 text-orange-600" />
                  Manual Entry
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/recipes/new?tab=ai")}
                  className="cursor-pointer"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-orange-600" />
                  AI Generate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/recipes/new?tab=import")}
                  className="cursor-pointer"
                >
                  <Import className="mr-2 h-4 w-4 text-orange-600" />
                  Import from URL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 hover:scale-105 transition-transform",
                  userButtonPopoverCard: "shadow-lg",
                  userButtonPopoverActionButton: "hover:bg-gray-50",
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="grid grid-cols-2 h-16">
          <Link href="/recipes">
            <button
              className={cn(
                "h-full w-full flex flex-col items-center justify-center gap-1 transition-colors",
                isRecipes
                  ? "text-orange-600"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <ChefHat className="h-5 w-5" />
              <span className="text-xs font-medium">Recipes</span>
            </button>
          </Link>
          <Link href="/planner">
            <button
              className={cn(
                "h-full w-full flex flex-col items-center justify-center gap-1 transition-colors",
                isPlanner
                  ? "text-orange-600"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs font-medium">Planner</span>
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
