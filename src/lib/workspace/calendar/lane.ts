import type { CalendarTaskBlock } from "@/types/calendar";
import { localDateKey } from "@/lib/workspace/calendar/time";

const MINUTES_PER_DAY = 24 * 60;
/** Keeps very short blocks readable (~18px on a 1440px grid). */
const MIN_HEIGHT_PCT = 1.25;

export type PlacedTaskBlock = {
  block: CalendarTaskBlock;
  /** Local date the placement belongs to, as YYYY-MM-DD (hybrid-day key). */
  dateKey: string;
  topPct: number;
  heightPct: number;
  column: number;
  columnCount: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

/**
 * ハイブリッド日（dayStartsHour 始まり）における日付キー。
 * 深夜跨ぎのグリッドで「どの列の日か」を決めるためにずらしてから localDateKey する。
 */
export function hybridDateKey(instant: Date, dayStartsHour: number): string {
  const shifted = new Date(instant.getTime());
  shifted.setHours(shifted.getHours() - (((dayStartsHour % 24) + 24) % 24));
  return localDateKey(shifted);
}

function hybridDayBounds(
  dateKey: string,
  dayStartsHour: number,
): { startMs: number; endMs: number } {
  const [y, m, d] = dateKey.split("-").map(Number);
  const h = ((dayStartsHour % 24) + 24) % 24;
  const start = new Date(y, m - 1, d, h, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

type Span = {
  block: CalendarTaskBlock;
  /** Offset ms from hybrid day start. */
  startMs: number;
  endMs: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

/**
 * Splits work blocks into hybrid days (starting at dayStartsHour), then packs
 * overlapping blocks into columns. Percentages match the schedule-x time axis.
 */
export function layoutTaskLane(
  blocks: CalendarTaskBlock[],
  dayStartsHour = 0,
): Map<string, PlacedTaskBlock[]> {
  const byDay = new Map<string, Span[]>();

  for (const block of blocks) {
    const start = new Date(block.start);
    const end = new Date(block.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    if (end.getTime() <= start.getTime()) continue;

    // Walk hybrid days that the block overlaps.
    let cursorKey = hybridDateKey(start, dayStartsHour);
    const endKey = hybridDateKey(
      new Date(end.getTime() - 1),
      dayStartsHour,
    );

    for (;;) {
      const { startMs: dayStartMs, endMs: dayEndMs } = hybridDayBounds(
        cursorKey,
        dayStartsHour,
      );
      const startMs = Math.max(start.getTime(), dayStartMs);
      const endMs = Math.min(end.getTime(), dayEndMs);
      if (endMs > startMs) {
        const spans = byDay.get(cursorKey) ?? [];
        spans.push({
          block,
          startMs: startMs - dayStartMs,
          endMs: endMs - dayStartMs,
          continuesBefore: start.getTime() < dayStartMs,
          continuesAfter: end.getTime() > dayEndMs,
        });
        byDay.set(cursorKey, spans);
      }
      if (cursorKey === endKey) break;
      const next = new Date(dayEndMs);
      cursorKey = localDateKey(next);
      // Safety: if we somehow loop forever
      if (next.getTime() >= end.getTime() + 48 * 60 * 60_000) break;
    }
  }

  const result = new Map<string, PlacedTaskBlock[]>();
  for (const [dateKey, spans] of byDay) {
    result.set(dateKey, packDay(dateKey, spans));
  }
  return result;
}

function packDay(
  dateKey: string,
  spans: Span[],
): PlacedTaskBlock[] {
  const sorted = [...spans].sort(
    (a, b) => a.startMs - b.startMs || b.endMs - a.endMs,
  );

  const placed: PlacedTaskBlock[] = [];
  let cluster: PlacedTaskBlock[] = [];
  let clusterEndMs = -Infinity;
  let columnEnds: number[] = [];

  const flush = () => {
    const columnCount = columnEnds.length || 1;
    for (const item of cluster) item.columnCount = columnCount;
    placed.push(...cluster);
    cluster = [];
    columnEnds = [];
    clusterEndMs = -Infinity;
  };

  for (const span of sorted) {
    if (span.startMs >= clusterEndMs) flush();

    let column = columnEnds.findIndex((endMs) => endMs <= span.startMs);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(span.endMs);
    } else {
      columnEnds[column] = span.endMs;
    }

    // startMs is already offset from hybrid day start.
    const topPct = (span.startMs / 60_000 / MINUTES_PER_DAY) * 100;
    const rawHeight =
      ((span.endMs - span.startMs) / 60_000 / MINUTES_PER_DAY) * 100;

    cluster.push({
      block: span.block,
      dateKey,
      topPct,
      heightPct: Math.min(Math.max(rawHeight, MIN_HEIGHT_PCT), 100 - topPct),
      column,
      columnCount: 1,
      continuesBefore: span.continuesBefore,
      continuesAfter: span.continuesAfter,
    });
    clusterEndMs = Math.max(clusterEndMs, span.endMs);
  }
  flush();

  return placed;
}
