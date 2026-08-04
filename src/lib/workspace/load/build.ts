import "server-only";

import {
  listGoogleEventsCached,
  resolveMainCalendarId,
} from "@/lib/workspace/calendar/events";
import {
  calendarWeekRange,
  endOfLocalDay,
} from "@/lib/workspace/calendar/time";
import {
  getCalendarPreferences,
  getStoredGoogleToken,
} from "@/lib/workspace/calendar/tokens";
import { hasGoogleCalendarOAuthConfig } from "@/lib/workspace/calendar/oauth";
import { listTasks } from "@/lib/workspace/tasks";
import { listWorkBlocksInRange } from "@/lib/workspace/work-blocks";
import {
  computeWorkloadSnapshot,
  type WorkloadSnapshot,
} from "@/lib/workspace/load/compute";

export type WorkloadBuildResult = {
  snapshot: WorkloadSnapshot;
  calendarConnected: boolean;
  oauthConfigured: boolean;
  /** Calendar fetch failed (auth etc.); snapshot still has task/work-block load. */
  calendarError: string | null;
};

/**
 * Load calendar + tasks + work blocks for the current week window,
 * then compute today / next3 / week load snapshots.
 */
export async function buildWorkloadSnapshot(): Promise<WorkloadBuildResult> {
  const oauthConfigured = hasGoogleCalendarOAuthConfig();
  const now = new Date();
  const week = calendarWeekRange(now, "monday");
  // Cover "next3" that may spill past Sunday into next week.
  const weekEnd = new Date(week.timeMax);
  const next3End = endOfLocalDay(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
  );
  // Always include full week start for "今週" bars (past days this week).
  const fetchMin = week.timeMin;
  const fetchMax =
    next3End.getTime() > weekEnd.getTime()
      ? next3End.toISOString()
      : week.timeMax;

  const [prefs, stored, inbox, active, waiting, overdue] = await Promise.all([
    getCalendarPreferences(),
    oauthConfigured ? getStoredGoogleToken() : Promise.resolve(null),
    listTasks({ status: "inbox", limit: 200 }),
    listTasks({ status: "active", limit: 200 }),
    listTasks({ status: "waiting", limit: 200 }),
    listTasks({ view: "overdue", limit: 100 }),
  ]);

  const calendarConnected = Boolean(stored);
  const taskMap = new Map(
    [...inbox, ...active, ...waiting, ...overdue].map((t) => [t.id, t]),
  );
  const tasks = [...taskMap.values()];

  let events: Awaited<ReturnType<typeof listGoogleEventsCached>> = [];
  let calendarError: string | null = null;

  try {
    const mainCalendarId = calendarConnected
      ? await resolveMainCalendarId(prefs.main_calendar_id)
      : null;
    if (calendarConnected && mainCalendarId) {
      events = await listGoogleEventsCached({
        timeMin: fetchMin,
        timeMax: fetchMax,
        calendarIds: [mainCalendarId],
      });
    }
  } catch (e) {
    calendarError =
      e instanceof Error ? e.message : "カレンダー予定の取得に失敗しました";
  }

  const workBlocks = await listWorkBlocksInRange({
    timeMin: fetchMin,
    timeMax: fetchMax,
    limit: 400,
  });

  const snapshot = computeWorkloadSnapshot({
    events,
    workBlocks: workBlocks.map((b) => ({
      id: b.id,
      task_id: b.task_id,
      starts_at: b.starts_at,
      ends_at: b.ends_at,
      taskStatus: b.task.status,
    })),
    tasks,
    now,
  });

  return { snapshot, calendarConnected, oauthConfigured, calendarError };
}
