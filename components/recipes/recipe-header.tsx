import { ChefHat, Clock, Users } from "lucide-react";
import Image from "next/image";

interface RecipeHeaderProps {
  title: string;
  description: string;
  imageUrl: string | null;
  servingsAmount: number;
  timePrep: string;
  timeCook: string;
  timeTotal: string;
  cuisine: string | null;
}

export function RecipeHeader({
  title,
  description,
  imageUrl,
  servingsAmount,
  timePrep,
  timeCook,
  timeTotal,
  cuisine,
}: RecipeHeaderProps) {
  return (
    <div className="space-y-6">
      {imageUrl && (
        <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
        {cuisine && (
          <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm mb-3">
            {cuisine}
          </span>
        )}
        <p className="text-muted-foreground text-lg">{description}</p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>
            <span className="font-medium">{servingsAmount}</span> servings
          </span>
        </div>

        {timePrep && (
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-muted-foreground" />
            <span>
              <span className="font-medium">Prep:</span> {timePrep}
            </span>
          </div>
        )}

        {timeCook && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>
              <span className="font-medium">Cook:</span> {timeCook}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>
            <span className="font-medium">Total:</span> {timeTotal}
          </span>
        </div>
      </div>
    </div>
  );
}
