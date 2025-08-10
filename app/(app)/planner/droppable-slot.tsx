"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DroppableSlotProps {
  id: string;
  entry?: {
    id: string;
    recipeTitle: string | null;
  } | null;
  onRemove: (entryId: string) => void;
}

export function DroppableSlot({ id, entry, onRemove }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[80px] p-2 border-b border-r transition-colors relative group",
        isOver && "bg-primary/10",
        !entry && "hover:bg-muted/50"
      )}
    >
      {entry ? (
        <div className="space-y-1">
          <p className="text-sm font-medium line-clamp-2">{entry.recipeTitle}</p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(entry.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          {isOver && (
            <p className="text-xs text-muted-foreground">Drop here</p>
          )}
        </div>
      )}
    </div>
  );
}