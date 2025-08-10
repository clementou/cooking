import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Instruction {
  id: string;
  stepNumber: number;
  text: string;
  notes: string | null;
}

interface Section {
  id: string;
  name: string;
  instructions: Instruction[];
}

interface RecipeInstructionsProps {
  sections: Section[];
  unsectionedInstructions: Instruction[];
}

export function RecipeInstructions({ sections, unsectionedInstructions }: RecipeInstructionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {unsectionedInstructions.length > 0 && (
          <div className="space-y-4">
            {unsectionedInstructions.map((instruction) => (
              <div key={instruction.id} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {instruction.stepNumber}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{instruction.text}</p>
                  {instruction.notes && (
                    <p className="text-xs text-muted-foreground italic">{instruction.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {sections.map((section) => 
          section.instructions.length > 0 && (
            <div key={section.id} className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {section.name}
              </h3>
              {section.instructions.map((instruction) => (
                <div key={instruction.id} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    {instruction.stepNumber}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{instruction.text}</p>
                    {instruction.notes && (
                      <p className="text-xs text-muted-foreground italic">{instruction.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}