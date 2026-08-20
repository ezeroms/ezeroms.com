"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Experience } from "@/types/content";
import {
  chronicleMonth,
  chronicleYear,
} from "@/lib/content/chronicle-filter";
import { formatExperiencePeriod } from "@/lib/content/experience-meta";
import { cn } from "@/lib/cn";
import { ExperienceDetail } from "@/components/experience/ExperienceDetail";

type Props = {
  items: Experience[];
};

type YearMonth = { year: string; month: string; key: string };

type Span = {
  item: Experience;
  col: string;
  /** 新しい側（上）の行インデックス */
  topIndex: number;
  /** 古い側（下）の行インデックス */
  bottomIndex: number;
  lane: number;
  laneCount: number;
};

const GUTTER_W = 48;
const ROW_H = 40;
const OTHER_COL = "その他";

const LINE_YEAR = "hsl(var(--border))";
const LINE_MONTH = "hsl(var(--border-subtle))";
const LINE_COL = "hsl(var(--border))";

/** 期間バー用。罫線色（#f1f3f4 等）と被らない彩度のある色だけ使う */
const CHIP_PALETTE = [
  {
    bg: "bg-[#d2e3fc]",
    text: "text-[#174ea6]",
    accent: "#1967d2",
  },
  {
    bg: "bg-[#fde293]",
    text: "text-[#e37400]",
    accent: "#f9ab00",
  },
  {
    bg: "bg-[#ceead6]",
    text: "text-[#0d652d]",
    accent: "#1e8e3e",
  },
  {
    bg: "bg-[#fad2cf]",
    text: "text-[#c5221f]",
    accent: "#d93025",
  },
  {
    bg: "bg-[#e9d2fd]",
    text: "text-[#7627bb]",
    accent: "#a142f4",
  },
  {
    bg: "bg-[#cbf0f8]",
    text: "text-[#007b83]",
    accent: "#12b5cb",
  },
  {
    bg: "bg-[#fdc69c]",
    text: "text-[#b06000]",
    accent: "#fa903e",
  },
  {
    bg: "bg-[#e6cff2]",
    text: "text-[#681da8]",
    accent: "#9334e6",
  },
] as const;

function chipStyleForKey(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return CHIP_PALETTE[hash % CHIP_PALETTE.length];
}

function columnOf(item: Experience): string {
  // 年表の列だけ雇用形態と別にしたい経歴（詳細カードの表記は employment_type のまま）
  if (item.slug === "yueisha-qumpoo" || item.slug === "synapse") {
    return "業務委託";
  }
  const value = item.employment_type?.trim();
  return value || OTHER_COL;
}

function toYearMonth(date: string): YearMonth | null {
  const year = chronicleYear(date);
  const month = chronicleMonth(date) || "01";
  if (!year) return null;
  return { year, month, key: `${year}-${month}` };
}

function currentYearMonth(now = new Date()): YearMonth {
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return { year, month, key: `${year}-${month}` };
}

/** newestKey から oldestKey まで（新しい→古い）連続の年月を返す */
function enumerateYearMonthsDesc(
  newest: YearMonth,
  oldest: YearMonth,
): YearMonth[] {
  let y = Number(newest.year);
  let m = Number(newest.month);
  const fy = Number(oldest.year);
  const fm = Number(oldest.month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return [newest];
  const out: YearMonth[] = [];
  while (y > fy || (y === fy && m >= fm)) {
    const month = String(m).padStart(2, "0");
    out.push({ year: String(y), month, key: `${y}-${month}` });
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (out.length > 600) break;
  }
  return out;
}

function sortByStartDesc(a: Experience, b: Experience): number {
  return b.start_date.localeCompare(a.start_date);
}

function monthLabel(month: string): string {
  const n = Number(month);
  if (!Number.isFinite(n) || n < 1 || n > 12) return month;
  return `${n}月`;
}

function resolveColumns(items: Experience[]): string[] {
  const set = new Set<string>();
  let hasOther = false;
  for (const item of items) {
    const col = columnOf(item);
    if (col === OTHER_COL) hasOther = true;
    else set.add(col);
  }
  const sorted = [...set].sort((a, b) => a.localeCompare(b, "ja"));
  if (hasOther) sorted.push(OTHER_COL);
  return sorted;
}

/**
 * Experience: 左=年月マトリクス（現在を最上段、現職は現在まで延伸）、右=一覧。
 */
export function ExperienceChart({ items }: Props) {
  const columns = useMemo(() => resolveColumns(items), [items]);
  const sorted = useMemo(() => [...items].sort(sortByStartDesc), [items]);
  const nowYm = useMemo(() => currentYearMonth(), []);

  const yearMonths = useMemo(() => {
    let oldest: YearMonth = nowYm;
    for (const item of items) {
      const start = toYearMonth(item.start_date);
      if (!start) continue;
      if (start.key < oldest.key) oldest = start;
    }
    return enumerateYearMonthsDesc(nowYm, oldest);
  }, [items, nowYm]);

  const indexByKey = useMemo(() => {
    const map = new Map<string, number>();
    yearMonths.forEach((ym, i) => map.set(ym.key, i));
    return map;
  }, [yearMonths]);

  const spans = useMemo(() => {
    const raw: Omit<Span, "lane" | "laneCount">[] = [];
    for (const item of items) {
      const start = toYearMonth(item.start_date);
      if (!start) continue;
      const startIdx = indexByKey.get(start.key);
      if (startIdx == null) continue;

      const ongoing = !item.end_date;
      const endYm = ongoing
        ? nowYm
        : toYearMonth(item.end_date!) ?? start;
      let endIdx = indexByKey.get(endYm.key);
      if (endIdx == null) {
        // 終了月が範囲外なら現在 or 開始に丸める
        endIdx = ongoing ? 0 : startIdx;
      }

      // 新しい側が上（小さい index）
      const topIndex = Math.min(startIdx, endIdx);
      const bottomIndex = Math.max(startIdx, endIdx);

      raw.push({
        item,
        col: columnOf(item),
        topIndex,
        bottomIndex,
      });
    }

    // 列ごとに重なりレーンを割り当て
    const byCol = new Map<string, typeof raw>();
    for (const span of raw) {
      const list = byCol.get(span.col) ?? [];
      list.push(span);
      byCol.set(span.col, list);
    }

    const result: Span[] = [];
    for (const [, list] of byCol) {
      const laneEnds: number[] = [];
      const assigned: Span[] = [];
      const ordered = [...list].sort((a, b) => a.topIndex - b.topIndex);
      for (const span of ordered) {
        let lane = laneEnds.findIndex((end) => end < span.topIndex);
        if (lane < 0) {
          lane = laneEnds.length;
          laneEnds.push(span.bottomIndex);
        } else {
          laneEnds[lane] = span.bottomIndex;
        }
        assigned.push({ ...span, lane, laneCount: 1 });
      }
      const laneCount = Math.max(1, laneEnds.length);
      for (const span of assigned) {
        result.push({ ...span, laneCount });
      }
    }
    return result;
  }, [items, indexByKey, nowYm]);

  const spansByCol = useMemo(() => {
    const map = new Map<string, Span[]>();
    for (const span of spans) {
      const list = map.get(span.col) ?? [];
      list.push(span);
      map.set(span.col, list);
    }
    return map;
  }, [spans]);

  const [selectedId, setSelectedId] = useState<string | null>(
    sorted[0]?.id ?? null,
  );
  const [hoverRowKey, setHoverRowKey] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectAndScroll = useCallback((id: string) => {
    setSelectedId(id);
    requestAnimationFrame(() => {
      const node = document.getElementById(`experience-item-${id}`);
      node?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    if (!selectedId && sorted[0]) setSelectedId(sorted[0].id);
  }, [selectedId, sorted]);

  const clearHover = useCallback(() => {
    setHoverRowKey(null);
    setHoverCol(null);
  }, []);

  if (!items.length) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        まだ経歴が登録されていません。
      </p>
    );
  }

  const gridHeight = yearMonths.length * ROW_H;

  return (
    <div className="flex h-[calc(100dvh-2.75rem)] flex-col lg:flex-row">
      <div
        className="min-h-0 w-full shrink-0 overflow-auto overscroll-contain bg-white lg:w-[45%] lg:max-w-[34rem] xl:max-w-[38rem]"
        style={{ borderRight: `1px solid ${LINE_COL}` }}
        id="experience-matrix"
        onMouseLeave={clearHover}
      >
        <div className="relative flex w-full min-w-0" style={{ height: gridHeight }}>
          {/* 年・月ガター */}
          <div className="sticky left-0 z-20 shrink-0 bg-white" style={{ width: GUTTER_W }}>
            {yearMonths.map((ym, rowIndex) => {
              const next = yearMonths[rowIndex + 1];
              const isYearBoundary = !next || next.year !== ym.year;
              const showYear =
                rowIndex === 0 || yearMonths[rowIndex - 1]!.year !== ym.year;
              const isCurrent = rowIndex === 0;
              return (
                <div
                  key={ym.key}
                  className={cn(
                    "box-border px-1 text-right tabular-nums",
                    isCurrent ? "text-[#1967d2]" : "text-[#70757a]",
                    hoverRowKey === ym.key && "bg-[#f8f9fa]",
                  )}
                  style={{
                    height: ROW_H,
                    borderBottom: `1px solid ${isYearBoundary ? LINE_YEAR : LINE_MONTH}`,
                  }}
                  onMouseEnter={() => {
                    setHoverRowKey(ym.key);
                    setHoverCol(null);
                  }}
                >
                  {showYear || isCurrent ? (
                    <div
                      className={cn(
                        "pt-1 text-xs font-medium leading-tight",
                        isCurrent ? "text-[#1967d2]" : "text-[#3c4043]",
                      )}
                    >
                      {ym.year}
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "text-xs font-normal leading-tight",
                      showYear || isCurrent
                        ? "text-[#9aa0a6]"
                        : "pt-1 text-[#70757a]",
                      isCurrent && "!text-[#1967d2]",
                    )}
                  >
                    {monthLabel(ym.month)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 列グリッド + 延伸バー */}
          <div
            className="relative flex min-w-0 flex-1"
            style={{
              borderLeft: `1px solid ${LINE_COL}`,
              height: gridHeight,
            }}
          >
            {columns.map((col, colIndex) => {
              const colSpans = spansByCol.get(col) ?? [];
              return (
                <div
                  key={col}
                  className="relative min-w-0 flex-1"
                  style={{
                    borderRight:
                      colIndex < columns.length - 1
                        ? `1px solid ${LINE_COL}`
                        : undefined,
                  }}
                  onMouseEnter={() => setHoverCol(col)}
                >
                  {/* 行の背景線 */}
                  {yearMonths.map((ym, rowIndex) => {
                    const next = yearMonths[rowIndex + 1];
                    const isYearBoundary = !next || next.year !== ym.year;
                    return (
                      <div
                        key={ym.key}
                        className={cn(
                          (hoverRowKey === ym.key || hoverCol === col) &&
                            "bg-[#f8f9fa]",
                        )}
                        style={{
                          height: ROW_H,
                          borderBottom: `1px solid ${isYearBoundary ? LINE_YEAR : LINE_MONTH}`,
                        }}
                        onMouseEnter={() => {
                          setHoverRowKey(ym.key);
                          setHoverCol(col);
                        }}
                      />
                    );
                  })}

                  {/* 期間バー: start〜end（または現在）の月を縦にまたぐ */}
                  {colSpans.map((span) => {
                    const chip = chipStyleForKey(span.item.organization);
                    const monthCount = span.bottomIndex - span.topIndex + 1;
                    const top = span.topIndex * ROW_H + 2;
                    const height = monthCount * ROW_H - 4;
                    const widthPct = 100 / span.laneCount;
                    const leftPct = span.lane * widthPct;
                    const selected = selectedId === span.item.id;

                    return (
                      <button
                        key={span.item.id}
                        type="button"
                        title={`${formatExperiencePeriod(span.item.start_date, span.item.end_date)} ${span.item.organization}`}
                        onClick={() => selectAndScroll(span.item.id)}
                        className={cn(
                          "absolute z-10 rounded-[4px] border-0 text-left",
                          "cursor-pointer text-xs font-medium leading-snug",
                          "whitespace-normal break-words",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1967d2]",
                          selected && "z-20",
                          chip.bg,
                          chip.text,
                        )}
                        style={{
                          top,
                          height: Math.max(height, ROW_H - 4),
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                          boxShadow: selected
                            ? `inset 3px 0 0 ${chip.accent}, 0 0 0 2px #1967d2`
                            : `inset 3px 0 0 ${chip.accent}`,
                        }}
                      >
                        {/* スクロール中も期間ラベルが見えるよう、バー内で sticky */}
                        <span
                          className={cn(
                            "sticky top-0 block px-1.5 py-1",
                            chip.bg,
                          )}
                        >                          <span className="block font-normal tabular-nums opacity-80">
                            {formatExperiencePeriod(
                              span.item.start_date,
                              span.item.end_date,
                            )}
                          </span>
                          <span className="block">{span.item.organization}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain bg-[#f8f9fa]"
        aria-label="経歴一覧"
      >
        <div className="flex flex-col gap-3 p-4">
          {sorted.map((item) => {
            const active = selectedId === item.id;
            return (
              <div
                key={item.id}
                id={`experience-item-${item.id}`}
                className="scroll-mt-4"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => selectAndScroll(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectAndScroll(item.id);
                    }
                  }}
                  className="cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1967d2]"
                >
                  <ExperienceDetail
                    item={item}
                    className={cn(
                      "pointer-events-none transition-[outline-color]",
                      active && "outline outline-1 outline-[#1967d2]",
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
