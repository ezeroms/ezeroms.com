import {
  calendarWeekRange,
  endOfLocalDay,
  localDateKey,
  startOfLocalDay,
} from "@/lib/workspace/calendar/time";
import type { GoogleCalendarEvent } from "@/types/calendar";
import type { TaskWorkBlock, WorkspaceTask } from "@/types/workspace";

export type LoadHorizon = "today" | "next3" | "week";

export type MeetingCategoryLoad = {
  /** Label from 【…】 in the event title, or 「その他」. */
  label: string;
  minutes: number;
  count: number;
};

export type DayLoad = {
  dateKey: string;
  label: string;
  /** Timed calendar events (minutes, clipped to day). All-day excluded. */
  meetingMinutes: number;
  /** Work blocks overlapping the day (minutes). */
  workBlockMinutes: number;
  /** Remaining estimate for due tasks that have no work block in the horizon. */
  unplacedDueMinutes: number;
  /** Due tasks without a usable estimate (and no work block). */
  unknownEstimateCount: number;
  meetingCount: number;
  workBlockCount: number;
  dueTaskCount: number;
};

export type UnplacedTask = {
  id: string;
  title: string;
  remainingMinutes: number | null;
  dueAt: string | null;
  progressPercent: number;
};

/** Work block overlapping the horizon (for dashboard list). */
export type ScheduledWorkBlock = {
  id: string;
  taskId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  /** Minutes overlapping the horizon window. */
  minutes: number;
};

export type HorizonLoad = {
  horizon: LoadHorizon;
  label: string;
  startKey: string;
  endKey: string;
  dayCount: number;
  capacityMinutes: number;
  meetingMinutes: number;
  /** Meeting minutes grouped by 【label】 in the event title. */
  meetingByLabel: MeetingCategoryLoad[];
  workBlockMinutes: number;
  /** Remaining estimates due in range with no work block in this horizon. */
  unplacedMinutes: number;
  unplacedUnknownCount: number;
  scheduledMinutes: number;
  /** scheduled / capacity */
  scheduledRatio: number;
  /** (scheduled + unplaced) / capacity */
  pressureRatio: number;
  level: "light" | "busy" | "over";
  days: DayLoad[];
  unplacedTasks: UnplacedTask[];
  /** Work blocks in this horizon, earliest first. */
  workBlocks: ScheduledWorkBlock[];
};

export type WorkloadSnapshot = {
  generatedAt: string;
  capacityMinutesPerDay: number;
  horizons: Record<LoadHorizon, HorizonLoad>;
};

/** Default focus capacity per local day (meetings + deep work). */
export const DEFAULT_CAPACITY_MINUTES_PER_DAY = 8 * 60;

const OPEN_STATUSES = new Set(["inbox", "active", "waiting"]);

function addLocalDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function dateKeysInclusive(start: Date, end: Date): string[] {
  const keys: string[] = [];
  let cur = startOfLocalDay(start);
  const last = startOfLocalDay(end);
  while (cur.getTime() <= last.getTime()) {
    keys.push(localDateKey(cur));
    cur = addLocalDays(cur, 1);
  }
  return keys;
}

function weekdayShort(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(date);
}

function monthDayLabel(dateKey: string): string {
  const [, m, d] = dateKey.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function dateFromKey(dateKey: string): Date {
  return new Date(
    Number(dateKey.slice(0, 4)),
    Number(dateKey.slice(5, 7)) - 1,
    Number(dateKey.slice(8, 10)),
  );
}

function overlapMinutes(
  startIso: string,
  endIso: string,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const start = Math.max(Date.parse(startIso), rangeStart.getTime());
  const end = Math.min(Date.parse(endIso), rangeEnd.getTime());
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }
  return Math.round((end - start) / 60_000);
}

export function remainingEstimateMinutes(
  task: Pick<WorkspaceTask, "estimated_minutes" | "progress_percent" | "status">,
): number | null {
  if (!OPEN_STATUSES.has(task.status)) return 0;
  const est = task.estimated_minutes;
  if (est == null || !Number.isFinite(est) || est <= 0) return null;
  const progress = Math.min(100, Math.max(0, task.progress_percent ?? 0));
  return Math.round(est * (1 - progress / 100));
}

function levelFromRatio(ratio: number): HorizonLoad["level"] {
  if (ratio >= 1) return "over";
  if (ratio >= 0.75) return "busy";
  return "light";
}

/** First 【label】 in the title; unlabeled → その他. */
export function eventCategoryLabel(summary: string): string {
  const match = summary.match(/【([^】]+)】/);
  const label = match?.[1]?.trim();
  return label || "その他";
}

function addCategoryMinutes(
  map: Map<string, { minutes: number; count: number }>,
  label: string,
  minutes: number,
) {
  if (minutes <= 0) return;
  const prev = map.get(label) ?? { minutes: 0, count: 0 };
  map.set(label, {
    minutes: prev.minutes + minutes,
    count: prev.count + 1,
  });
}

function sortedCategories(
  map: Map<string, { minutes: number; count: number }>,
): MeetingCategoryLoad[] {
  return [...map.entries()]
    .map(([label, v]) => ({ label, minutes: v.minutes, count: v.count }))
    .sort((a, b) => {
      if (b.minutes !== a.minutes) return b.minutes - a.minutes;
      if (a.label === "その他") return 1;
      if (b.label === "その他") return -1;
      return a.label.localeCompare(b.label, "ja");
    });
}

function horizonWindow(
  horizon: LoadHorizon,
  now = new Date(),
): { keys: string[]; label: string } {
  const today = startOfLocalDay(now);
  if (horizon === "today") {
    return { keys: [localDateKey(today)], label: "今日" };
  }
  if (horizon === "next3") {
    return {
      keys: dateKeysInclusive(today, addLocalDays(today, 2)),
      label: "今後3日",
    };
  }
  const week = calendarWeekRange(today, "monday");
  const weekStart = new Date(week.timeMin);
  const weekEnd = addLocalDays(new Date(week.timeMax), -1);
  return {
    keys: dateKeysInclusive(weekStart, weekEnd),
    label: "今週",
  };
}

/** Overdue due dates collapse onto today for load pressure. */
function dueDateKey(
  task: Pick<WorkspaceTask, "due_at">,
  todayKey: string,
): string | null {
  if (!task.due_at) return null;
  const due = new Date(task.due_at);
  if (Number.isNaN(due.getTime())) return null;
  const key = localDateKey(due);
  return key < todayKey ? todayKey : key;
}

export function computeWorkloadSnapshot(input: {
  events: GoogleCalendarEvent[];
  workBlocks: Array<
    Pick<TaskWorkBlock, "id" | "task_id" | "starts_at" | "ends_at"> & {
      taskStatus?: string;
      taskTitle?: string;
    }
  >;
  tasks: WorkspaceTask[];
  now?: Date;
  capacityMinutesPerDay?: number;
}): WorkloadSnapshot {
  const now = input.now ?? new Date();
  const todayKey = localDateKey(now);
  const capacityMinutesPerDay =
    input.capacityMinutesPerDay ?? DEFAULT_CAPACITY_MINUTES_PER_DAY;

  const openTasks = input.tasks.filter((t) => OPEN_STATUSES.has(t.status));
  const taskTitleById = new Map(input.tasks.map((t) => [t.id, t.title]));
  const blocksForLoad = input.workBlocks.filter(
    (b) => b.taskStatus !== "archived",
  );

  const horizons = {} as Record<LoadHorizon, HorizonLoad>;

  for (const horizon of ["today", "next3", "week"] as LoadHorizon[]) {
    const { keys, label } = horizonWindow(horizon, now);
    const keySet = new Set(keys);

    const horizonStart = startOfLocalDay(dateFromKey(keys[0]));
    const horizonEnd = endOfLocalDay(dateFromKey(keys[keys.length - 1]));

    const taskIdsWithBlock = new Set<string>();
    const scheduledBlocks: ScheduledWorkBlock[] = [];
    for (const block of blocksForLoad) {
      const mins = overlapMinutes(
        block.starts_at,
        block.ends_at,
        horizonStart,
        horizonEnd,
      );
      if (mins <= 0) continue;
      taskIdsWithBlock.add(block.task_id);
      scheduledBlocks.push({
        id: block.id,
        taskId: block.task_id,
        title:
          block.taskTitle?.trim() ||
          taskTitleById.get(block.task_id) ||
          "（無題）",
        startsAt: block.starts_at,
        endsAt: block.ends_at,
        minutes: mins,
      });
    }
    scheduledBlocks.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    const unplacedTasks: UnplacedTask[] = [];
    let unplacedMinutes = 0;
    let unplacedUnknownCount = 0;
    const unplacedByDay = new Map<string, number>();
    const unknownByDay = new Map<string, number>();
    const dueCountByDay = new Map<string, number>();

    for (const task of openTasks) {
      const attributed = dueDateKey(task, todayKey);
      if (attributed == null || !keySet.has(attributed)) continue;
      dueCountByDay.set(attributed, (dueCountByDay.get(attributed) ?? 0) + 1);

      if (taskIdsWithBlock.has(task.id)) continue;

      const remaining = remainingEstimateMinutes(task);
      if (remaining == null) {
        unplacedUnknownCount += 1;
        unknownByDay.set(attributed, (unknownByDay.get(attributed) ?? 0) + 1);
        unplacedTasks.push({
          id: task.id,
          title: task.title,
          remainingMinutes: null,
          dueAt: task.due_at,
          progressPercent: task.progress_percent ?? 0,
        });
        continue;
      }
      if (remaining <= 0) continue;

      unplacedMinutes += remaining;
      unplacedByDay.set(
        attributed,
        (unplacedByDay.get(attributed) ?? 0) + remaining,
      );
      unplacedTasks.push({
        id: task.id,
        title: task.title,
        remainingMinutes: remaining,
        dueAt: task.due_at,
        progressPercent: task.progress_percent ?? 0,
      });
    }

    unplacedTasks.sort((a, b) => {
      const am = a.remainingMinutes ?? -1;
      const bm = b.remainingMinutes ?? -1;
      if (am < 0 && bm < 0) return a.title.localeCompare(b.title);
      if (am < 0) return 1;
      if (bm < 0) return -1;
      return bm - am;
    });

    const meetingByLabelMap = new Map<
      string,
      { minutes: number; count: number }
    >();

    const days: DayLoad[] = keys.map((dateKey) => {
      const dayStart = startOfLocalDay(dateFromKey(dateKey));
      const dayEnd = endOfLocalDay(dayStart);

      let meetingMinutes = 0;
      let meetingCount = 0;
      for (const ev of input.events) {
        if (ev.allDay) continue;
        const mins = overlapMinutes(ev.start, ev.end, dayStart, dayEnd);
        if (mins > 0) {
          meetingMinutes += mins;
          meetingCount += 1;
          addCategoryMinutes(
            meetingByLabelMap,
            eventCategoryLabel(ev.summary),
            mins,
          );
        }
      }

      let workBlockMinutes = 0;
      let workBlockCount = 0;
      for (const block of blocksForLoad) {
        const mins = overlapMinutes(
          block.starts_at,
          block.ends_at,
          dayStart,
          dayEnd,
        );
        if (mins > 0) {
          workBlockMinutes += mins;
          workBlockCount += 1;
        }
      }

      return {
        dateKey,
        label: `${monthDayLabel(dateKey)}（${weekdayShort(dateKey)}）`,
        meetingMinutes,
        workBlockMinutes,
        unplacedDueMinutes: unplacedByDay.get(dateKey) ?? 0,
        unknownEstimateCount: unknownByDay.get(dateKey) ?? 0,
        meetingCount,
        workBlockCount,
        dueTaskCount: dueCountByDay.get(dateKey) ?? 0,
      };
    });

    const meetingByLabel = sortedCategories(meetingByLabelMap);

    const meetingMinutes = days.reduce((s, d) => s + d.meetingMinutes, 0);
    const workBlockMinutes = days.reduce((s, d) => s + d.workBlockMinutes, 0);
    const scheduledMinutes = meetingMinutes + workBlockMinutes;
    const capacityMinutes = keys.length * capacityMinutesPerDay;
    const scheduledRatio =
      capacityMinutes > 0 ? scheduledMinutes / capacityMinutes : 0;
    const pressureRatio =
      capacityMinutes > 0
        ? (scheduledMinutes + unplacedMinutes) / capacityMinutes
        : 0;

    horizons[horizon] = {
      horizon,
      label,
      startKey: keys[0],
      endKey: keys[keys.length - 1],
      dayCount: keys.length,
      capacityMinutes,
      meetingMinutes,
      meetingByLabel,
      workBlockMinutes,
      unplacedMinutes,
      unplacedUnknownCount,
      scheduledMinutes,
      scheduledRatio,
      pressureRatio,
      level: levelFromRatio(Math.max(scheduledRatio, pressureRatio)),
      days,
      unplacedTasks: unplacedTasks.slice(0, 12),
      workBlocks: scheduledBlocks.slice(0, 24),
    };
  }

  return {
    generatedAt: now.toISOString(),
    capacityMinutesPerDay,
    horizons,
  };
}
