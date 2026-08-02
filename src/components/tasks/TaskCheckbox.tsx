"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  checked: boolean;
  onChange: () => void;
  label?: string;
  className?: string;
  size?: "sm" | "md";
};

/** TickTick 風の丸チェック。ネイティブ checkbox のダサさを避ける。 */
export function TaskCheckbox({
  checked,
  onChange,
  label = "完了",
  className,
  size = "sm",
}: Props) {
  const dim = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border transition-all duration-150",
        dim,
        checked
          ? "border-foreground bg-foreground text-background"
          : "border-border-hover bg-card text-transparent hover:border-foreground/40",
        className,
      )}
    >
      <Check
        className={cn(
          "transition-opacity duration-150",
          size === "md" ? "size-3" : "size-2.5",
          checked ? "opacity-100" : "opacity-0",
        )}
        strokeWidth={2.5}
        aria-hidden
      />
    </button>
  );
}
