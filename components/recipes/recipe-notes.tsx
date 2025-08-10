import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Package, Lightbulb, FileText } from "lucide-react";

interface Note {
  id: string;
  kind: string;
  text: string;
  orderIndex: number;
}

interface RecipeNotesProps {
  notes: Note[];
}

const noteIcons: { [key: string]: React.ReactNode } = {
  storage: <Package className="w-4 h-4" />,
  tip: <Lightbulb className="w-4 h-4" />,
  variation: <Info className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
};

const noteLabels: { [key: string]: string } = {
  storage: "Storage",
  tip: "Tip",
  variation: "Variation",
  note: "Note",
};

export function RecipeNotes({ notes }: RecipeNotesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes & Tips</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="flex gap-3 items-start">
            <div className="flex-shrink-0 text-muted-foreground">
              {noteIcons[note.kind] || noteIcons.note}
            </div>
            <div className="flex-1">
              <span className="font-medium text-sm">
                {noteLabels[note.kind] || "Note"}:
              </span>
              <p className="text-sm text-muted-foreground mt-1">{note.text}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}