"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  WEEKDAY_LABELS,
} from "@/lib/content/notes-filter";
import {
  categoryLabel,
  columnFilterActive,
  emptyColumnFilter,
  formatMonthLabel,
  serializeColumnFilter,
  type ColumnFilterState,
} from "@/lib/content/column-filter";
import { cn } from "@/lib/cn";

type Section = "period" | "weekday" | "category" | "tag" | null;

type Props = {
  months: string[];
  categories: string[];
  tags: string[];
  initial: ColumnFilterState;
  basePath?: string;
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

export function ColumnFilterPanel({
  months,
  categories,
  tags,
  initial,
  basePath = "/column/",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<Section>(null);
  const [draft, setDraft] = useState<ColumnFilterState>(initial);

  const monthsNewestFirst = useMemo(
    () => [...months].sort((a, b) => b.localeCompare(a)),
    [months],
  );

  const categoriesSorted = useMemo(
    () =>
      [...categories].sort((a, b) =>
        categoryLabel(a).localeCompare(categoryLabel(b), "ja"),
      ),
    [categories],
  );

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(initial) ||
    columnFilterActive(draft);

  const canClear = columnFilterActive(draft) || columnFilterActive(initial);

  function toggleSection(key: Section) {
    setOpen((prev) => (prev === key ? null : key));
  }

  function apply() {
    const qs = serializeColumnFilter(draft);
    router.push(`${basePath}${qs}`);
    setOpen(null);
  }

  function clearAll() {
    const empty = emptyColumnFilter();
    setDraft(empty);
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
            label="時期"
            summary={summary(draft.months.map(formatMonthLabel))}
            open={open === "period"}
            onToggle={() => toggleSection("period")}
          >
            <div className="flex flex-col gap-1.5">
              {monthsNewestFirst.map((ym) => (
                <label
                  key={ym}
                  className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.months.includes(ym)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        months: toggleInList(d.months, ym),
                      }))
                    }
                  />
                  <span>{formatMonthLabel(ym)}</span>
                </label>
              ))}
              {!monthsNewestFirst.length ? (
                <p className="m-0 text-[13px] text-muted-foreground">
                  月データがありません
                </p>
              ) : null}
            </div>
          </FilterRow>

          <FilterRow
            label="曜日"
            summary={summary(
              draft.weekdays.map((w) => `${WEEKDAY_LABELS[w]}曜`),
            )}
            open={open === "weekday"}
            onToggle={() => toggleSection("weekday")}
            bordered
          >
            <div className="grid grid-cols-4 gap-1.5">
              {WEEKDAY_LABELS.map((label, i) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.weekdays.includes(i)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        weekdays: toggleInList(d.weekdays, i),
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </FilterRow>

          <FilterRow
            label="カテゴリ"
            summary={summary(draft.categories.map(categoryLabel))}
            open={open === "category"}
            onToggle={() => toggleSection("category")}
            bordered
          >
            <div className="flex flex-col gap-1.5">
              {categoriesSorted.map((cat) => (
                <label
                  key={cat}
                  className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.categories.includes(cat)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        categories: toggleInList(d.categories, cat),
                      }))
                    }
                  />
                  <span>{categoryLabel(cat)}</span>
                </label>
              ))}
              {!categoriesSorted.length ? (
                <p className="m-0 text-[13px] text-muted-foreground">
                  カテゴリがありません
                </p>
              ) : null}
            </div>
          </FilterRow>

          <FilterRow
            label="タグ"
            summary={summary(draft.tags)}
            open={open === "tag"}
            onToggle={() => toggleSection("tag")}
            bordered
          >
            <div className="flex flex-col gap-1.5">
              {tags.map((tag) => (
                <label
                  key={tag}
                  className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.tags.includes(tag)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        tags: toggleInList(d.tags, tag),
                      }))
                    }
                  />
                  <span>{tag}</span>
                </label>
              ))}
              {!tags.length ? (
                <p className="m-0 text-[13px] text-muted-foreground">
                  タグがありません
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
          disabled={!dirty && !columnFilterActive(initial)}
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
