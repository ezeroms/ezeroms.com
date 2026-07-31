import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import type { CalendarTaskLink } from "@/types/calendar";
import type { TaskPriority, TaskStatus } from "@/types/workspace";

export type CalendarLink = {
  id: string;
  task_id: string | null;
  project_id: string | null;
  google_calendar_id: string;
  google_event_id: string;
  sync_status: "linked" | "pending" | "error" | "detached";
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function upsertCalendarLink(input: {
  taskId: string;
  projectId?: string | null;
  googleCalendarId: string;
  googleEventId: string;
}): Promise<CalendarLink> {
  const { data, error } = await getWorkspaceAdmin()
    .from("calendar_links")
    .upsert(
      {
        task_id: input.taskId,
        project_id: input.projectId ?? null,
        google_calendar_id: input.googleCalendarId,
        google_event_id: input.googleEventId,
        sync_status: "linked",
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "google_calendar_id,google_event_id" },
    )
    .select(
      "id, task_id, project_id, google_calendar_id, google_event_id, sync_status, last_synced_at, created_at, updated_at",
    )
    .single();
  if (error) throw new Error(error.message);
  return data as CalendarLink;
}

type LinkedTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
};

type LinkedTaskRow = {
  google_calendar_id: string;
  google_event_id: string;
  /** PostgREST returns an object for to-one embeds, but stay tolerant. */
  task: LinkedTask | LinkedTask[] | null;
};

/**
 * Resolves which of the given Google event ids are Task work blocks.
 * Matching stays scoped to the ids we already loaded so the query is bounded.
 */
export async function listTaskLinksForEvents(
  googleEventIds: string[],
): Promise<CalendarTaskLink[]> {
  const ids = [...new Set(googleEventIds)].filter(Boolean);
  if (ids.length === 0) return [];

  const { data, error } = await getWorkspaceAdmin()
    .from("calendar_links")
    .select(
      "google_calendar_id, google_event_id, task:tasks (id, title, status, priority)",
    )
    .eq("sync_status", "linked")
    .not("task_id", "is", null)
    .in("google_event_id", ids);
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as LinkedTaskRow[]).flatMap((row) => {
    const task = Array.isArray(row.task) ? row.task[0] : row.task;
    if (!task || task.status === "archived") return [];
    return [
      {
        googleCalendarId: row.google_calendar_id,
        googleEventId: row.google_event_id,
        taskId: task.id,
        taskTitle: task.title,
        taskStatus: task.status,
        taskPriority: task.priority,
      },
    ];
  });
}

export async function listCalendarLinksForTask(
  taskId: string,
): Promise<CalendarLink[]> {
  const { data, error } = await getWorkspaceAdmin()
    .from("calendar_links")
    .select(
      "id, task_id, project_id, google_calendar_id, google_event_id, sync_status, last_synced_at, created_at, updated_at",
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as CalendarLink[]) ?? [];
}
