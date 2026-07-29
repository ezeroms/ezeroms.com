"use client";

import { useState } from "react";
import { CalendarDateModal } from "@/components/filter/CalendarDateModal";
import { cn } from "@/lib/cn";
import {
  formatDateLabel,
  type DateRangeValue,
} from "@/lib/content/date-range";
import { filterFieldClass } from "@/lib/site/tag-styles";

type Props = {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  className?: string;
};

type Which = "from" | "to";

/**
 * いつから〜いつまで。入力クリックでカレンダーモーダルを開く。
 */
export function DateRangeField({ value, onChange, className }: Props) {
  const [editing, setEditing] = useState<Which | null>(null);

  function setPart(which: Which, iso: string) {
    const nextDate = iso || null;
    if (which === "from") {
      let to = value.to;
      if (nextDate && to && nextDate > to) to = nextDate;
      onChange({ from: nextDate, to });
      return;
    }
    let from = value.from;
    if (nextDate && from && nextDate < from) from = nextDate;
    onChange({ from, to: nextDate });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing("from")}
          className={filterFieldClass({
            empty: !value.from,
            className: "flex-1",
          })}
        >
          {value.from ? formatDateLabel(value.from) : "いつから"}
        </button>
        <span className="shrink-0 text-xs text-muted-foreground" aria-hidden>
          〜
        </span>
        <button
          type="button"
          onClick={() => setEditing("to")}
          className={filterFieldClass({
            empty: !value.to,
            className: "flex-1",
          })}
        >
          {value.to ? formatDateLabel(value.to) : "いつまで"}
        </button>
      </div>

      <CalendarDateModal
        open={editing === "from"}
        title="いつから"
        value={value.from}
        max={value.to}
        onSelect={(iso) => setPart("from", iso)}
        onClose={() => setEditing(null)}
      />
      <CalendarDateModal
        open={editing === "to"}
        title="いつまで"
        value={value.to}
        min={value.from}
        onSelect={(iso) => setPart("to", iso)}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
