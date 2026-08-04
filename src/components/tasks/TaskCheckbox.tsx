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

/** 丸チェック。通常は枠線のみ、完了時は緑塗り＋✓。 */
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
        "task-checkbox inline-flex shrink-0 items-center justify-center rounded-full",
        dim,
        className,
      )}
    >
      <Check
        className={cn(
          size === "md" ? "size-3" : "size-2.5",
          checked ? "opacity-100" : "opacity-0",
        )}
        strokeWidth={3}
        aria-hidden
      />
    </button>
  );
}
