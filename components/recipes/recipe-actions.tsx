"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Printer, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface RecipeActionsProps {
  recipeId: string;
  recipeTitle: string;
}

export function RecipeActions({ recipeId, recipeTitle }: RecipeActionsProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: recipeTitle,
          text: `Check out this recipe: ${recipeTitle}`,
          url: url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Recipe link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy link");
      }
    }
  };

  return (
    <div className="flex items-center justify-between">
      <Link href="/recipes">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Recipes
        </Button>
      </Link>

      <div className="flex items-center gap-2">
        <Link href={`/recipes/${recipeId}/edit`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          disabled={isPrinting}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          Print
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
