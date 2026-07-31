"use client";

import { cn } from "@/lib/cn";
import type { PlacedTaskBlock } from "@/lib/workspace/calendar/lane";
import {
  formatHybridTimeRange,
} from "@/lib/workspace/calendar/time";

function timeParts(iso: string): { hour: number; minute: number } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return { hour: d.getHours(), minute: d.getMinutes() };
}

function timeRangeLabel(
  startIso: string,
  endIso: string,
  dayStartsHour: number,
): string {
  const start = timeParts(startIso);
  const end = timeParts(endIso);
  if (!start || !end) return "";
  return formatHybridTimeRange(start, end, dayStartsHour);
}

type Props = {
  placed: PlacedTaskBlock[];
  dayStartsHour?: number;
  onTaskClick?: (taskId: string) => void;
};

/** Renders one day's Task work blocks into the right lane of the time grid. */
export function TaskLane({
  placed,
  dayStartsHour = 0,
  onTaskClick,
}: Props) {
  return (
    <div className="sx-task-lane" aria-label="タスク">
      {placed.map((p) => {
        const done = p.block.taskStatus === "done";
        const width = 100 / p.columnCount;
        const range = timeRangeLabel(
          p.block.start,
          p.block.end,
          dayStartsHour,
        );
        const label = `${range} ${p.block.taskTitle}`;
        return (
          <button
            key={`${p.block.taskId}-${p.dateKey}-${p.column}`}
            type="button"
            title={label}
            aria-label={label}
            className={cn(
              "sx-task-lane__chip",
              done && "sx-task-lane__chip--done",
              p.block.taskPriority === "high" && "sx-task-lane__chip--high",
            )}
            style={{
              top: `${p.topPct}%`,
              height: `${p.heightPct}%`,
              insetInlineStart: `${p.column * width}%`,
              width: `calc(${width}% - 2px)`,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTaskClick?.(p.block.taskId);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="sx-task-lane__title">
              {p.block.taskTitle || "（無題）"}
            </span>
            <span className="sx-task-lane__time">
              {p.continuesBefore ? "↑ " : ""}
              {range}
              {p.continuesAfter ? " ↓" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
