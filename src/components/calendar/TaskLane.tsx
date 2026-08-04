"use client";

import { cn } from "@/lib/cn";
import type { PlacedTaskBlock } from "@/lib/workspace/calendar/lane";
import {
  formatHybridTimeRange,
} from "@/lib/workspace/calendar/time";
import type { CalendarTaskBlock } from "@/types/calendar";

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

export type TaskLaneClickTarget = {
  taskId: string;
  workBlockId: string;
  start: string;
  end: string;
};

export type TaskLaneMoveStart = {
  block: CalendarTaskBlock;
  pointerId: number;
  clientX: number;
  clientY: number;
};

function isMovableWorkBlockId(id: string): boolean {
  return !id.startsWith("optimistic-") && !id.startsWith("task:");
}

type Props = {
  placed: PlacedTaskBlock[];
  dayStartsHour?: number;
  onTaskClick?: (target: TaskLaneClickTarget) => void;
  /** 作業枠のドラッグ移動開始（ポインタダウン時）。 */
  onTaskMoveStart?: (payload: TaskLaneMoveStart) => void;
  /** いまドラッグ中の作業枠（半透明表示）。 */
  movingWorkBlockId?: string | null;
};

/** Renders one day's Task work blocks into the right lane of the time grid. */
export function TaskLane({
  placed,
  dayStartsHour = 0,
  onTaskClick,
  onTaskMoveStart,
  movingWorkBlockId = null,
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
        const movable =
          Boolean(onTaskMoveStart) && isMovableWorkBlockId(p.block.workBlockId);
        const moving = movingWorkBlockId === p.block.workBlockId;
        return (
          <button
            key={`${p.block.workBlockId}-${p.dateKey}-${p.column}`}
            type="button"
            title={label}
            aria-label={label}
            className={cn(
              "sx-task-lane__chip",
              done && "sx-task-lane__chip--done",
              p.block.taskPriority === "high" && "sx-task-lane__chip--high",
              movable && "sx-task-lane__chip--movable",
              moving && "sx-task-lane__chip--moving",
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
              // 移動可能な枠は click を親の pointerup で処理する
              if (movable) return;
              onTaskClick?.({
                taskId: p.block.taskId,
                workBlockId: p.block.workBlockId,
                start: p.block.start,
                end: p.block.end,
              });
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (!movable || e.button !== 0) return;
              e.preventDefault();
              onTaskMoveStart?.({
                block: p.block,
                pointerId: e.pointerId,
                clientX: e.clientX,
                clientY: e.clientY,
              });
            }}
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
