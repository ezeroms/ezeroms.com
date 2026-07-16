"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  WEEKDAY_LABELS,
  emptyNotesFilter,
  formatMonthLabel,
  notesFilterActive,
  serializeNotesFilter,
  type NotesFilterState,
} from "@/lib/content/notes-filter";
import { cn } from "@/lib/cn";

type Section = "period" | "weekday" | "tag" | "place" | null;

type Props = {
  months: string[];
  tags: string[];
  places?: string[];
  initial: NotesFilterState;
  /** Base path for filter apply (default /diary/) */
  basePath?: string;
  /** Hide place filter (e.g. Clips). Default true when places provided. */
  showPlaces?: boolean;
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

export function NotesFilterPanel({
  months,
  tags,
  places = [],
  initial,
  basePath = "/diary/",
  showPlaces = true,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<Section>(null);
  const [draft, setDraft] = useState<NotesFilterState>(initial);

  const monthsNewestFirst = useMemo(
    () => [...months].sort((a, b) => b.localeCompare(a)),
    [months],
  );

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(initial) ||
    notesFilterActive(draft);

  const canClear = notesFilterActive(draft) || notesFilterActive(initial);

  function toggleSection(key: Section) {
    setOpen((prev) => (prev === key ? null : key));
  }

  function apply() {
    const qs = serializeNotesFilter(draft);
    router.push(`${basePath}${qs}`);
    setOpen(null);
  }

  function clearAll() {
    const empty = emptyNotesFilter();
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

          {showPlaces ? (
            <FilterRow
              label="場所"
              summary={summary(draft.places)}
              open={open === "place"}
              onToggle={() => toggleSection("place")}
              bordered
            >
              <div className="flex flex-col gap-1.5">
                {places.map((place) => (
                  <label
                    key={place}
                    className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={draft.places.includes(place)}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          places: toggleInList(d.places, place),
                        }))
                      }
                    />
                    <span>{place}</span>
                  </label>
                ))}
                {!places.length ? (
                  <p className="m-0 text-[13px] text-muted-foreground">
                    場所がありません
                  </p>
                ) : null}
              </div>
            </FilterRow>
          ) : null}
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
          disabled={!dirty && !notesFilterActive(initial)}
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
