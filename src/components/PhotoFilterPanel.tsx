"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  emptyPhotoFilter,
  photoFilterActive,
  serializePhotoFilter,
  type PhotoFilterState,
} from "@/lib/content/photo-filter";
import { cn } from "@/lib/cn";

type Section = "year" | null;

type Props = {
  years: string[];
  initial: PhotoFilterState;
  basePath: string;
};

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function summary(values: string[]): string {
  if (!values.length) return "指定なし";
  if (values.length <= 2) return values.join("、");
  return `${values.slice(0, 2).join("、")} 他${values.length - 2}`;
}

export function PhotoFilterPanel({ years, initial, basePath }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<Section>(null);
  const [draft, setDraft] = useState<PhotoFilterState>({
    ...initial,
    tags: [],
  });

  const yearsNewestFirst = useMemo(
    () => [...years].sort((a, b) => b.localeCompare(a)),
    [years],
  );

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(initial) ||
    photoFilterActive(draft);
  const canClear = photoFilterActive(draft) || photoFilterActive(initial);

  function toggleSection(key: Section) {
    setOpen((prev) => (prev === key ? null : key));
  }

  function apply() {
    router.push(
      `${basePath}${serializePhotoFilter({ ...draft, tags: [] })}`,
    );
    setOpen(null);
  }

  function clearAll() {
    setDraft(emptyPhotoFilter());
    router.push(basePath);
    setOpen(null);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 pb-3">
        <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          絞り込み
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="overflow-hidden rounded-md border border-border">
          <FilterRow
            label="年"
            summary={summary(draft.years.map((y) => `${y}年`))}
            open={open === "year"}
            onToggle={() => toggleSection("year")}
          >
            <div className="flex flex-col gap-1.5">
              {yearsNewestFirst.map((y) => (
                <label
                  key={y}
                  className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.years.includes(y)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        years: toggleInList(d.years, y),
                      }))
                    }
                  />
                  <span>{y}年</span>
                </label>
              ))}
              {!yearsNewestFirst.length ? (
                <p className="m-0 text-[13px] text-muted-foreground">
                  年データがありません
                </p>
              ) : null}
            </div>
          </FilterRow>
        </div>
      </div>

      <div className="mt-auto shrink-0 space-y-2 border-t border-border pt-3">
        <button
          type="button"
          className={cn(
            "w-full rounded-md border-0 px-4 py-2.5 text-sm font-semibold",
            "bg-primary text-primary-foreground",
            "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
          )}
          onClick={apply}
          disabled={!dirty && !photoFilterActive(initial)}
        >
          絞り込み
        </button>
        {canClear ? (
          <button
            type="button"
            className={cn(
              "w-full rounded-md border border-border bg-transparent px-4 py-2.5 text-[13px]",
              "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            onClick={clearAll}
          >
            クリア
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  summary: summaryText,
  open,
  onToggle,
  bordered,
  children,
}: {
  label: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(bordered && "border-t border-border")}>
      <button
        type="button"
        className={cn(
          "grid w-full grid-cols-[auto_1fr_auto] items-center gap-2",
          "border-0 bg-transparent px-3 py-2.5 text-left",
          "cursor-pointer text-foreground hover:bg-accent",
        )}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="whitespace-nowrap text-sm font-semibold">{label}</span>
        <span className="truncate text-[13px] text-muted-foreground">
          {summaryText}
        </span>
        <span className="text-xs text-muted-foreground" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        <div className="max-h-52 overflow-y-auto border-t border-border px-3 py-2.5">
          {children}
        </div>
      ) : null}
    </div>
  );
}
