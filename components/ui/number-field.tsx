"use client";

import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NumberFieldProps = {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  placeholder?: string;
};

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
  inputClassName,
  disabled,
  placeholder,
}: NumberFieldProps) {
  const clamp = (n: number) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const set = (n: number) => onChange?.(clamp(n));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={() => set((Number(value) || 0) - step)}>
        <Minus className="size-4" />
      </Button>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => set(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className={cn("[appearance:textfield] no-spinner text-center", inputClassName)}
        placeholder={placeholder}
      />
      <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={() => set((Number(value) || 0) + step)}>
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

export default NumberField;


