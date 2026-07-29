"use client";

import { cn } from "@/lib/cn";
import { toggleListValue } from "@/components/filter/filterPanelUtils";
import { filterChipClass } from "@/lib/site/tag-styles";

export type FilterChipOption<T extends string | number = string> = {
  value: T;
  label: string;
  description?: string;
};

type Props<T extends string | number> = {
  options: FilterChipOption<T>[];
  value: T[];
  onChange: (next: T[]) => void;
  emptyMessage?: string;
  className?: string;
};

/** 複数選択用のチップ群。一覧タグと同系のフラットな見た目。 */
export function FilterOptionChips<T extends string | number>({
  options,
  value,
  onChange,
  emptyMessage = "選択肢がありません",
  className,
}: Props<T>) {
  if (!options.length) {
    return (
      <p className="m-0 text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={selected}
            title={option.description}
            onClick={() => onChange(toggleListValue(value, option.value))}
            className={filterChipClass(selected)}
          >
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
