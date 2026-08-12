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

export type TaskLaneResizeStart = {
  block: CalendarTaskBlock;
  pointerId: number;
  clientX: number;
  clientY: number;
};

/** DB に保存済みの作業枠 ID（楽観 ID・仮 ID は除外） */
export function isPersistedWorkBlockId(id: string): boolean {
  return !id.startsWith("optimistic-") && !id.startsWith("task:");
}

type Props = {
  placed: PlacedTaskBlock[];
  dayStartsHour?: number;
  onTaskClick?: (target: TaskLaneClickTarget) => void;
  /** 作業枠のドラッグ移動開始（ポインタダウン時）。 */
  onTaskMoveStart?: (payload: TaskLaneMoveStart) => void;
  /** 作業枠の下端リサイズ開始。 */
  onTaskResizeStart?: (payload: TaskLaneResizeStart) => void;
  /** いまドラッグ／リサイズ中の作業枠（半透明表示）。 */
  movingWorkBlockId?: string | null;
};

/** Renders one day's Task work blocks into the right lane of the time grid. */
export function TaskLane({
  placed,
  dayStartsHour = 0,
  onTaskClick,
  onTaskMoveStart,
  onTaskResizeStart,
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
        const persisted = isPersistedWorkBlockId(p.block.workBlockId);
        const movable = Boolean(onTaskMoveStart) && persisted;
        const resizable = Boolean(onTaskResizeStart) && persisted;
        const moving = movingWorkBlockId === p.block.workBlockId;
        return (
          <button
            key={`${p.block.workBlockId}-${p.dateKey}-${p.column}`}
            type="button"
            title={label}
            aria-label={label}
            aria-busy={!persisted}
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
              // 保存前の楽観枠は開かない／移動可能な枠は click を親の pointerup で処理
              if (!persisted || movable) return;
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
            {resizable ? (
              <span
                className="sx-task-lane__resize"
                aria-hidden
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.button !== 0) return;
                  onTaskResizeStart?.({
                    block: p.block,
                    pointerId: e.pointerId,
                    clientX: e.clientX,
                    clientY: e.clientY,
                  });
                }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
