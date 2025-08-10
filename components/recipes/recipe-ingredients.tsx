"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface Ingredient {
  id: string;
  rawText: string;
  quantityNumerator: number | null;
  quantityDenominator: number | null;
  unit: string | null;
  preparation: string | null;
  notes: string | null;
  orderIndex: number;
}

interface Section {
  id: string;
  name: string;
  ingredients: Ingredient[];
}

interface RecipeIngredientsProps {
  sections: Section[];
  unsectionedIngredients: Ingredient[];
}

// function formatQuantity(numerator: number | null, denominator: number | null): string {
//   if (!numerator || !denominator) return "";
//   
//   const decimal = numerator / denominator;
//   
//   if (decimal % 1 === 0) {
//     return decimal.toString();
//   }
//   
//   const wholeNumber = Math.floor(decimal);
//   const fraction = decimal - wholeNumber;
//   
//   const fractionMap: { [key: number]: string } = {
//     0.25: "¼",
//     0.5: "½",
//     0.75: "¾",
//     0.333: "⅓",
//     0.667: "⅔",
//     0.125: "⅛",
//     0.375: "⅜",
//     0.625: "⅝",
//     0.875: "⅞",
//   };
//   
//   const fractionRounded = Math.round(fraction * 1000) / 1000;
//   const fractionString = fractionMap[fractionRounded] || fraction.toFixed(2);
//   
//   if (wholeNumber > 0) {
//     return `${wholeNumber} ${fractionString}`;
//   }
//   
//   return fractionString;
// }

function IngredientItem({ ingredient }: { ingredient: Ingredient }) {
  const [checked, setChecked] = useState(false);
  
  return (
    <div className="flex items-start gap-3 py-1">
      <Checkbox
        checked={checked}
        onCheckedChange={(checkedState) => setChecked(checkedState === true)}
        className="mt-0.5"
      />
      <label 
        className={`text-sm flex-1 cursor-pointer ${checked ? "line-through text-muted-foreground" : ""}`}
        onClick={() => setChecked(!checked)}
      >
        {ingredient.rawText}
      </label>
    </div>
  );
}

export function RecipeIngredients({ sections, unsectionedIngredients }: RecipeIngredientsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingredients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {unsectionedIngredients.length > 0 && (
          <div className="space-y-2">
            {unsectionedIngredients.map((ingredient) => (
              <IngredientItem key={ingredient.id} ingredient={ingredient} />
            ))}
          </div>
        )}
        
        {sections.map((section) => 
          section.ingredients.length > 0 && (
            <div key={section.id} className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {section.name}
              </h3>
              {section.ingredients.map((ingredient) => (
                <IngredientItem key={ingredient.id} ingredient={ingredient} />
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}