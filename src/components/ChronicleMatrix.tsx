"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Chronicle } from "@/types/content";
import {
  chronicleMonth,
  chronicleYear,
  formatChronicleDate,
  formatChronicleWhen,
} from "@/lib/content/chronicle-filter";
import { CHRONICLE_OTHER_THEME } from "@/lib/content/chronicle-themes";
import { cn } from "@/lib/cn";
import {
  ChronicleEventPopover,
  type AnchorRect,
} from "@/components/ChronicleEventPopover";

type Props = {
  items: Chronicle[];
  themes: string[];
};

type YearMonth = { year: string; month: string; key: string };

const COL_W = 160;
const GUTTER_W = 56;
const ROW_MIN_H = 88;

/** 年の境目（ややはっきり） */
const LINE_YEAR = "#dadce0";
/** 月の境目（年より弱く） */
const LINE_MONTH = "#f1f3f4";
/** 縦線・ヘッダー */
const LINE_COL = "#e8eaed";

const CHIP_PALETTE = [
  { bg: "bg-[#e8f0fe]", text: "text-[#1967d2]", ring: "ring-[#d2e3fc]" },
  { bg: "bg-[#fef7e0]", text: "text-[#e37400]", ring: "ring-[#fde293]" },
  { bg: "bg-[#e6f4ea]", text: "text-[#137333]", ring: "ring-[#ceead6]" },
  { bg: "bg-[#fce8e6]", text: "text-[#c5221f]", ring: "ring-[#fad2cf]" },
  { bg: "bg-[#f3e8fd]", text: "text-[#7627bb]", ring: "ring-[#e9d2fd]" },
  { bg: "bg-[#e0f7fa]", text: "text-[#007b83]", ring: "ring-[#b2ebf2]" },
  { bg: "bg-[#fce8d5]", text: "text-[#b05d00]", ring: "ring-[#fdc69c]" },
  { bg: "bg-[#f1f3f4]", text: "text-[#3c4043]", ring: "ring-[#e8eaed]" },
] as const;

function chipStyleForTheme(theme: string) {
  let hash = 0;
  for (let i = 0; i < theme.length; i++) {
    hash = (hash * 31 + theme.charCodeAt(i)) >>> 0;
  }
  return CHIP_PALETTE[hash % CHIP_PALETTE.length];
}

function cellMatchesTheme(item: Chronicle, theme: string): boolean {
  const tags = item.chronicle_tag ?? [];
  if (theme === CHRONICLE_OTHER_THEME) return tags.length === 0;
  return tags.includes(theme);
}

function sortByDateDesc(a: Chronicle, b: Chronicle): number {
  const da = new Date(a.date).getTime();
  const db = new Date(b.date).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) {
    return b.date.localeCompare(a.date);
  }
  return db - da;
}

function monthLabel(month: string): string {
  const n = Number(month);
  if (!Number.isFinite(n) || n < 1 || n > 12) return month;
  return `${n}月`;
}

/**
 * 行=年月（上=最近）、列=テーマ。
 * 年の境の横線は月より少し強くする。
 */
export function ChronicleMatrix({ items, themes }: Props) {
  const columns = themes;

  const yearMonths = useMemo(() => {
    const map = new Map<string, YearMonth>();
    for (const item of items) {
      const year = chronicleYear(item.date);
      const month =
        item.date_precision === "year"
          ? "01"
          : chronicleMonth(item.date) || "01";
      if (!year) continue;
      const key = `${year}-${month}`;
      if (!map.has(key)) map.set(key, { year, month, key });
    }
    return [...map.values()].sort((a, b) => {
      const byYear = b.year.localeCompare(a.year);
      if (byYear !== 0) return byYear;
      return b.month.localeCompare(a.month);
    });
  }, [items]);

  const eventsByYmTheme = useMemo(() => {
    const map = new Map<string, Chronicle[]>();
    for (const item of items) {
      const year = chronicleYear(item.date);
      const month =
        item.date_precision === "year"
          ? "01"
          : chronicleMonth(item.date) || "01";
      if (!year) continue;
      for (const theme of columns) {
        if (!cellMatchesTheme(item, theme)) continue;
        const key = `${year}-${month}::${theme}`;
        const list = map.get(key) ?? [];
        list.push(item);
        map.set(key, list);
      }
    }
    for (const list of map.values()) {
      list.sort(sortByDateDesc);
    }
    return map;
  }, [items, columns]);

  const [hoverRowKey, setHoverRowKey] = useState<string | null>(null);
  const [hoverTheme, setHoverTheme] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [items, activeId],
  );

  const closePopover = useCallback(() => {
    setActiveId(null);
    setAnchor(null);
  }, []);

  const openPopover = useCallback(
    (itemId: string, target: HTMLElement) => {
      if (activeId === itemId) {
        closePopover();
        return;
      }
      const rect = target.getBoundingClientRect();
      setActiveId(itemId);
      setAnchor({
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      });
    },
    [activeId, closePopover],
  );

  const clearHover = useCallback(() => {
    setHoverRowKey(null);
    setHoverTheme(null);
  }, []);

  const gridWidth = columns.length * COL_W;

  if (!columns.length) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        表示できるテーマがありません。
      </p>
    );
  }

  if (!yearMonths.length) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        条件に合う出来事がありません。
      </p>
    );
  }

  return (
    <>
      <div
        className="h-full min-h-0 overflow-auto overscroll-contain bg-white"
        id="chronicle-matrix"
        onMouseLeave={clearHover}
      >
        <div
          className="relative"
          style={{ width: GUTTER_W + gridWidth, minWidth: "100%" }}
        >
          <div
            className="sticky top-0 z-20 flex bg-white"
            style={{ borderBottom: `1px solid ${LINE_COL}` }}
          >
            <div
              className="sticky left-0 z-30 shrink-0 bg-white"
              style={{ width: GUTTER_W }}
            />
            <div className="flex" style={{ width: gridWidth }}>
              {columns.map((theme, index) => {
                const active = hoverTheme === theme;
                return (
                  <div
                    key={theme}
                    title={theme}
                    className={cn(
                      "shrink-0 px-2 py-3 text-center text-xs font-medium tracking-wide text-[#70757a]",
                      active && "bg-[#f8f9fa]",
                    )}
                    style={{
                      width: COL_W,
                      borderRight:
                        index < columns.length - 1
                          ? `1px solid ${LINE_COL}`
                          : undefined,
                    }}
                    onMouseEnter={() => {
                      setHoverTheme(theme);
                      setHoverRowKey(null);
                    }}
                  >
                    <span className="line-clamp-1">{theme}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {yearMonths.map((ym, rowIndex) => {
            const next = yearMonths[rowIndex + 1];
            const isYearBoundary = !next || next.year !== ym.year;
            const showYear = rowIndex === 0 || yearMonths[rowIndex - 1]!.year !== ym.year;
            const rowActive = hoverRowKey === ym.key;
            const rowLine = isYearBoundary ? LINE_YEAR : LINE_MONTH;

            return (
              <div
                key={ym.key}
                className="flex"
                style={{ minHeight: ROW_MIN_H }}
              >
                <div
                  className={cn(
                    "sticky left-0 z-10 shrink-0 bg-white px-1.5 pt-1.5 text-right",
                    "tabular-nums text-[#70757a]",
                    rowActive && "text-[#3c4043]",
                  )}
                  style={{ width: GUTTER_W }}
                  onMouseEnter={() => {
                    setHoverRowKey(ym.key);
                    setHoverTheme(null);
                  }}
                >
                  {showYear ? (
                    <div className="text-xs font-medium leading-tight text-[#3c4043]">
                      {ym.year}
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "text-xs font-normal leading-tight",
                      showYear ? "mt-0.5 text-[#9aa0a6]" : "text-[#70757a]",
                    )}
                  >
                    {monthLabel(ym.month)}
                  </div>
                </div>

                <div
                  className="flex"
                  style={{
                    width: gridWidth,
                    minHeight: ROW_MIN_H,
                    borderLeft: `1px solid ${LINE_COL}`,
                    borderBottom: `1px solid ${rowLine}`,
                  }}
                >
                  {columns.map((theme, index) => {
                    const cellEvents =
                      eventsByYmTheme.get(`${ym.key}::${theme}`) ?? [];
                    const colActive = hoverTheme === theme;
                    const cellActive = rowActive || colActive;
                    const chip = chipStyleForTheme(theme);

                    return (
                      <div
                        key={`${ym.key}-${theme}`}
                        className={cn(
                          "shrink-0 p-1",
                          cellActive && "bg-[#f8f9fa]",
                        )}
                        style={{
                          width: COL_W,
                          minHeight: ROW_MIN_H,
                          borderRight:
                            index < columns.length - 1
                              ? `1px solid ${LINE_COL}`
                              : undefined,
                        }}
                        onMouseEnter={() => {
                          setHoverRowKey(ym.key);
                          setHoverTheme(theme);
                        }}
                      >
                        <div className="flex flex-col gap-0.5">
                          {cellEvents.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              title={`${formatChronicleWhen(item)} ${item.title}`}
                              onMouseDown={(event) => event.stopPropagation()}
                              onClick={(event) =>
                                openPopover(item.id, event.currentTarget)
                              }
                              className={cn(
                                "w-full rounded-[4px] border-0 px-1.5 py-0.5 text-left",
                                "cursor-pointer text-xs font-medium leading-snug",
                                "whitespace-normal break-words",
                                "ring-1 ring-inset",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1967d2]",
                                activeId === item.id && "ring-2 ring-[#1967d2]",
                                chip.bg,
                                chip.text,
                                chip.ring,
                              )}
                            >
                              <span className="mr-1 font-normal tabular-nums opacity-70">
                                {formatChronicleDate(
                                  item.date,
                                  item.date_precision ?? "day",
                                ).replace(/^\d{4}\//, "")}
                                {item.end_date ? "–" : ""}
                              </span>
                              {item.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isClientMounted && activeItem && anchor ? (
        <ChronicleEventPopover
          item={activeItem}
          anchor={anchor}
          onClose={closePopover}
        />
      ) : null}
    </>
  );
}
