"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  addMonths,
  formatDateLabel,
  parseIsoDate,
} from "@/lib/content/date-range";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

type Props = {
  open: boolean;
  title: string;
  value: string | null;
  onSelect: (isoDate: string) => void;
  onClose: () => void;
  /** 選択可能な下限（YYYY-MM-DD） */
  min?: string | null;
  /** 選択可能な上限（YYYY-MM-DD） */
  max?: string | null;
};

function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

function toIso(year: number, month0: number, day: number): string {
  return `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * 日付1つを選ぶカレンダーモーダル。
 */
export function CalendarDateModal({
  open,
  title,
  value,
  onSelect,
  onClose,
  min = null,
  max = null,
}: Props) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  const initialCursor = useMemo(() => {
    const parsed = value ? parseIsoDate(value) : null;
    if (parsed) {
      const [y, m] = parsed.split("-").map(Number);
      return { year: y!, month0: m! - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month0: now.getMonth() };
  }, [value]);

  const [cursor, setCursor] = useState(initialCursor);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setCursor(initialCursor);
  }, [open, initialCursor]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const cells = useMemo(() => {
    const { year, month0 } = cursor;
    const firstWeekday = new Date(year, month0, 1).getDay();
    const total = daysInMonth(year, month0);
    const leading = Array.from({ length: firstWeekday }, () => null as number | null);
    const days = Array.from({ length: total }, (_, i) => i + 1);
    return [...leading, ...days];
  }, [cursor]);

  const monthLabel = useMemo(() => {
    const d = new Date(cursor.year, cursor.month0, 1);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long" });
  }, [cursor]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 m-0 cursor-default border-0 p-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 w-full max-w-[20rem] rounded-lg border border-border bg-background p-4 shadow-none",
          "font-sans text-foreground",
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id={titleId} className="m-0 text-sm font-semibold tracking-wide">
            {title}
          </h2>
          <button
            type="button"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent",
              "appearance-none text-muted-foreground shadow-none hover:bg-accent hover:text-foreground",
            )}
            aria-label="閉じる"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent",
              "appearance-none text-foreground shadow-none hover:bg-accent",
            )}
            aria-label="前の月"
            onClick={() =>
              setCursor((c) => addMonths(c.year, c.month0, -1))
            }
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <p className="m-0 text-sm font-medium">{monthLabel}</p>
          <button
            type="button"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent",
              "appearance-none text-foreground shadow-none hover:bg-accent",
            )}
            aria-label="次の月"
            onClick={() =>
              setCursor((c) => addMonths(c.year, c.month0, 1))
            }
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center text-[0.65rem] text-muted-foreground">
          {WEEKDAYS.map((label) => (
            <div key={label} className="py-1 font-medium">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, index) => {
            if (day == null) {
              return <div key={`e-${index}`} className="h-9" />;
            }
            const iso = toIso(cursor.year, cursor.month0, day);
            const disabled =
              (min != null && iso < min) || (max != null && iso > max);
            const selected = value === iso;
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onSelect(iso);
                  onClose();
                }}
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-md border-0 text-sm shadow-none",
                  "appearance-none",
                  selected
                    ? "bg-muted font-medium text-foreground ring-1 ring-foreground"
                    : "bg-transparent text-foreground hover:bg-accent",
                  disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        {value ? (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <p className="m-0 text-xs text-muted-foreground">
              選択中: {formatDateLabel(value)}
            </p>
            <button
              type="button"
              className="border-0 bg-transparent text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => {
                onSelect("");
                onClose();
              }}
            >
              クリア
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
