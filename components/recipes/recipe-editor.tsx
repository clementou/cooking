"use client";

import { useState } from "react";
import { ChefHat, Clock, Users, Plus, Trash2, Check, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

interface IngredientLine {
  id?: string;
  item: string;
  amount?: number;
  unit?: string;
  notes?: string;
}

interface InstructionStep {
  id?: string;
  stepNumber: number;
  text: string;
  notes?: string;
}

interface RecipeSection {
  id?: string;
  name: string;
  ingredients: IngredientLine[];
  instructions: InstructionStep[];
}

interface RecipeData {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  servingsAmount: number;
  timePrep?: string;
  timeCook?: string;
  timeTotal: string;
  cuisine?: string | null;
  sections: RecipeSection[];
  notes?: string[];
}

interface RecipeEditorProps {
  initialData?: RecipeData;
  mode: "create" | "edit";
  onSave?: (data: RecipeData) => Promise<void>;
}

export function RecipeEditor({ initialData, mode, onSave }: RecipeEditorProps) {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(mode === "create");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  
  const [data, setData] = useState<RecipeData>(
    initialData || {
      title: "New Recipe",
      description: "Add a description for your recipe",
      servingsAmount: 4,
      timeTotal: "30 min",
      sections: [
        {
          name: "Main",
          ingredients: [],
          instructions: []
        }
      ],
      notes: []
    }
  );

  // Auto-save functionality
  const autoSave = useDebouncedCallback(
    async (newData: RecipeData) => {
      if (mode === "edit" && onSave) {
        setSaveStatus("saving");
        try {
          await onSave(newData);
          setSaveStatus("saved");
        } catch (error) {
          console.error("Auto-save failed:", error);
          setSaveStatus("unsaved");
        }
      }
    },
    2000
  );

  const updateData = (updates: Partial<RecipeData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    setSaveStatus("unsaved");
    autoSave(newData);
  };

  const updateSection = (sectionIndex: number, updates: Partial<RecipeSection>) => {
    const newSections = [...data.sections];
    newSections[sectionIndex] = { ...newSections[sectionIndex], ...updates };
    updateData({ sections: newSections });
  };

  const addIngredient = (sectionIndex: number) => {
    const newSections = [...data.sections];
    newSections[sectionIndex].ingredients.push({
      item: "",
      amount: undefined,
      unit: ""
    });
    updateData({ sections: newSections });
  };

  const updateIngredient = (sectionIndex: number, ingredientIndex: number, updates: Partial<IngredientLine>) => {
    const newSections = [...data.sections];
    newSections[sectionIndex].ingredients[ingredientIndex] = {
      ...newSections[sectionIndex].ingredients[ingredientIndex],
      ...updates
    };
    updateData({ sections: newSections });
  };

  const removeIngredient = (sectionIndex: number, ingredientIndex: number) => {
    const newSections = [...data.sections];
    newSections[sectionIndex].ingredients.splice(ingredientIndex, 1);
    updateData({ sections: newSections });
  };

  const addInstruction = (sectionIndex: number) => {
    const newSections = [...data.sections];
    const currentSteps = newSections[sectionIndex].instructions;
    newSections[sectionIndex].instructions.push({
      stepNumber: currentSteps.length + 1,
      text: ""
    });
    updateData({ sections: newSections });
  };

  const updateInstruction = (sectionIndex: number, stepIndex: number, updates: Partial<InstructionStep>) => {
    const newSections = [...data.sections];
    newSections[sectionIndex].instructions[stepIndex] = {
      ...newSections[sectionIndex].instructions[stepIndex],
      ...updates
    };
    updateData({ sections: newSections });
  };

  const removeInstruction = (sectionIndex: number, stepIndex: number) => {
    const newSections = [...data.sections];
    newSections[sectionIndex].instructions.splice(stepIndex, 1);
    // Renumber remaining steps
    newSections[sectionIndex].instructions.forEach((step, idx) => {
      step.stepNumber = idx + 1;
    });
    updateData({ sections: newSections });
  };

  const addSection = () => {
    const newSections = [...data.sections, {
      name: "New Section",
      ingredients: [],
      instructions: []
    }];
    updateData({ sections: newSections });
  };

  const removeSection = (sectionIndex: number) => {
    if (data.sections.length > 1) {
      const newSections = data.sections.filter((_, idx) => idx !== sectionIndex);
      updateData({ sections: newSections });
    }
  };

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(data);
        if (mode === "edit") {
          toast.success("Recipe saved successfully!");
          setIsEditMode(false);
        }
        // For create mode, navigation is handled by the parent component
      } catch (error) {
        console.error("Failed to save recipe:", error);
        toast.error("Failed to save recipe");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    if (mode === "edit") {
      setIsEditMode(false);
      if (initialData) {
        setData(initialData);
      }
    } else {
      router.push("/recipes");
    }
  };

  const EditableText = ({ 
    value, 
    onChange, 
    className, 
    placeholder,
    multiline = false 
  }: { 
    value: string; 
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    multiline?: boolean;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    if (!isEditMode) {
      return <span className={className}>{value || placeholder}</span>;
    }

    if (isEditing) {
      return multiline ? (
        <textarea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => {
            onChange(tempValue);
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setTempValue(value);
              setIsEditing(false);
            }
          }}
          className={cn("w-full bg-transparent outline-none resize-none", className)}
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => {
            onChange(tempValue);
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onChange(tempValue);
              setIsEditing(false);
            } else if (e.key === "Escape") {
              setTempValue(value);
              setIsEditing(false);
            }
          }}
          className={cn("bg-transparent outline-none", className)}
          autoFocus
        />
      );
    }

    return (
      <span
        onClick={() => {
          setIsEditing(true);
          setTempValue(value);
        }}
        className={cn(
          "cursor-text hover:bg-muted/50 px-1 -mx-1 rounded transition-colors",
          className
        )}
      >
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode === "edit" && !isEditMode && (
            <Button onClick={() => setIsEditMode(true)} size="sm">
              Edit Recipe
            </Button>
          )}
          {isEditMode && (
            <>
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
        
        {isEditMode && (
          <div className="text-sm text-muted-foreground">
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "All changes saved"}
            {saveStatus === "unsaved" && "Unsaved changes"}
          </div>
        )}
      </div>

      {/* Recipe Header */}
      <div className="space-y-6">
        {data.imageUrl && (
          <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden">
            <Image
              src={data.imageUrl}
              alt={data.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <EditableText
              value={data.title}
              onChange={(value) => updateData({ title: value })}
              placeholder="Recipe Title"
            />
          </h1>
          
          {(data.cuisine || isEditMode) && (
            <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm mb-3">
              <EditableText
                value={data.cuisine || ""}
                onChange={(value) => updateData({ cuisine: value })}
                placeholder="Cuisine type"
              />
            </span>
          )}
          
          <p className="text-muted-foreground text-lg">
            <EditableText
              value={data.description}
              onChange={(value) => updateData({ description: value })}
              placeholder="Add a description for your recipe"
              multiline
            />
          </p>
        </div>

        {/* Recipe Meta */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>
              <EditableText
                value={String(data.servingsAmount)}
                onChange={(value) => updateData({ servingsAmount: parseInt(value) || 1 })}
                placeholder="4"
              />
              {" servings"}
            </span>
          </div>

          {(data.timePrep || isEditMode) && (
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-muted-foreground" />
              <span>
                Prep:{" "}
                <EditableText
                  value={data.timePrep || ""}
                  onChange={(value) => updateData({ timePrep: value })}
                  placeholder="15 min"
                />
              </span>
            </div>
          )}

          {(data.timeCook || isEditMode) && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                Cook:{" "}
                <EditableText
                  value={data.timeCook || ""}
                  onChange={(value) => updateData({ timeCook: value })}
                  placeholder="30 min"
                />
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>
              Total:{" "}
              <EditableText
                value={data.timeTotal}
                onChange={(value) => updateData({ timeTotal: value })}
                placeholder="45 min"
              />
            </span>
          </div>
        </div>
      </div>

      {/* Recipe Sections */}
      <div className="mt-8 space-y-8">
        {data.sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                <EditableText
                  value={section.name}
                  onChange={(value) => updateSection(sectionIdx, { name: value })}
                  placeholder="Section Name"
                />
              </h2>
              {isEditMode && data.sections.length > 1 && (
                <Button
                  onClick={() => removeSection(sectionIdx)}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Ingredients */}
              <div className="md:col-span-1">
                <h3 className="font-medium mb-4">Ingredients</h3>
                <ul className="space-y-2">
                  {section.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-2 group">
                      <span className="text-muted-foreground">•</span>
                      <div className="flex-1">
                        {isEditMode ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={ingredient.amount || ""}
                              onChange={(e) => updateIngredient(sectionIdx, idx, { 
                                amount: e.target.value ? parseFloat(e.target.value) : undefined 
                              })}
                              placeholder="1"
                              className="w-16 bg-transparent outline-none border-b border-transparent hover:border-muted-foreground focus:border-primary"
                            />
                            <input
                              type="text"
                              value={ingredient.unit || ""}
                              onChange={(e) => updateIngredient(sectionIdx, idx, { unit: e.target.value })}
                              placeholder="cup"
                              className="w-20 bg-transparent outline-none border-b border-transparent hover:border-muted-foreground focus:border-primary"
                            />
                            <input
                              type="text"
                              value={ingredient.item}
                              onChange={(e) => updateIngredient(sectionIdx, idx, { item: e.target.value })}
                              placeholder="ingredient"
                              className="flex-1 bg-transparent outline-none border-b border-transparent hover:border-muted-foreground focus:border-primary"
                            />
                            <Button
                              onClick={() => removeIngredient(sectionIdx, idx)}
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span>
                            {ingredient.amount && `${ingredient.amount} `}
                            {ingredient.unit && `${ingredient.unit} `}
                            {ingredient.item}
                            {ingredient.notes && ` (${ingredient.notes})`}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                  {isEditMode && (
                    <li>
                      <Button
                        onClick={() => addIngredient(sectionIdx)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add ingredient
                      </Button>
                    </li>
                  )}
                </ul>
              </div>

              {/* Instructions */}
              <div className="md:col-span-2">
                <h3 className="font-medium mb-4">Instructions</h3>
                <ol className="space-y-4">
                  {section.instructions.map((step, idx) => (
                    <li key={idx} className="flex gap-3 group">
                      <span className="font-medium text-muted-foreground">{step.stepNumber}.</span>
                      <div className="flex-1">
                        {isEditMode ? (
                          <div className="flex items-start gap-2">
                            <textarea
                              value={step.text}
                              onChange={(e) => updateInstruction(sectionIdx, idx, { text: e.target.value })}
                              placeholder="Describe this step..."
                              className="flex-1 bg-transparent outline-none border-b border-transparent hover:border-muted-foreground focus:border-primary resize-none"
                              rows={2}
                            />
                            <Button
                              onClick={() => removeInstruction(sectionIdx, idx)}
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <p>{step.text}</p>
                        )}
                        {step.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Note: {step.notes}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                  {isEditMode && (
                    <li>
                      <Button
                        onClick={() => addInstruction(sectionIdx)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground ml-7"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add step
                      </Button>
                    </li>
                  )}
                </ol>
              </div>
            </div>
          </div>
        ))}
        
        {isEditMode && (
          <Button
            onClick={addSection}
            variant="outline"
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        )}
      </div>

      {/* Notes */}
      {(data.notes && data.notes.length > 0) && (
        <div className="mt-8">
          <h3 className="font-medium mb-4">Notes</h3>
          <ul className="space-y-2">
            {data.notes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}