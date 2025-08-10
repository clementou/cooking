"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableRecipeProps {
  recipe: {
    id: string;
    title: string;
    description: string;
    servingsAmount: number;
    timeTotal: string;
  };
}

export function DraggableRecipe({ recipe }: DraggableRecipeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: recipe.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab transition-all",
        isDragging && "opacity-50 cursor-grabbing"
      )}
      {...listeners}
      {...attributes}
    >
      <CardContent className="p-3 space-y-2">
        <h3 className="font-medium text-sm line-clamp-1">{recipe.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {recipe.description}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{recipe.servingsAmount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{recipe.timeTotal}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}