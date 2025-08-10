"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ShoppingCart, CalendarIcon, Loader2, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ShoppingListModalProps {
  currentWeekStart: string;
}

export function ShoppingListModal({ currentWeekStart }: ShoppingListModalProps) {
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>(() => {
    const start = new Date(currentWeekStart + 'T00:00:00');
    const end = new Date(currentWeekStart + 'T00:00:00');
    end.setDate(end.getDate() + 6);
    return { from: start, to: end };
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState<{
    ingredients: Array<{ ingredient: string; recipes: string[] }>;
    recipes: Array<{ title: string; totalServings: number }>;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const generateShoppingList = async () => {
    setIsLoading(true);
    try {
      const start = format(dateRange.from, 'yyyy-MM-dd');
      const end = format(dateRange.to, 'yyyy-MM-dd');
      
      const response = await fetch(`/api/shopping-list?start=${start}&end=${end}`);
      
      if (!response.ok) throw new Error('Failed to generate shopping list');
      
      const data = await response.json();
      setShoppingList(data);
    } catch (error) {
      console.error('Error generating shopping list:', error);
      toast.error("Failed to generate shopping list");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shoppingList) return;
    
    const text = shoppingList.ingredients
      .map(item => `• ${item.ingredient}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Shopping list copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ShoppingCart className="w-4 h-4" />
          Shopping List
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Shopping List</DialogTitle>
          <DialogDescription>
            Select a date range to generate a shopping list from your meal plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                    disabled={(date) => date < dateRange.from}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button 
            onClick={generateShoppingList} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Generate Shopping List
              </>
            )}
          </Button>

          {/* Shopping List Display */}
          {shoppingList && (
            <div className="space-y-4">
              <Separator />
              
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Shopping List</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy List
                    </>
                  )}
                </Button>
              </div>

              {shoppingList.recipes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {shoppingList.recipes.map((recipe, i) => (
                    <Badge key={i} variant="secondary">
                      {recipe.title} ({recipe.totalServings} servings)
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {shoppingList.ingredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recipes scheduled for this date range
                  </p>
                ) : (
                  shoppingList.ingredients.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1">•</span>
                      <div className="flex-1">
                        <span>{item.ingredient}</span>
                        {item.recipes.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({item.recipes.join(", ")})
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}