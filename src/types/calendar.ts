import type { TaskPriority, TaskStatus, WorkspaceTask } from "@/types/workspace";

export type GoogleCalendarListItem = {
  id: string;
  summary: string;
  primary: boolean;
  accessRole: string;
  backgroundColor: string | null;
  foregroundColor: string | null;
  /** accessRole is reader/freeBusyReader → treat as read-only */
  readOnly: boolean;
};

export type GoogleCalendarEvent = {
  id: string;
  calendarId: string;
  calendarSummary: string;
  summary: string;
  description: string | null;
  location: string | null;
  htmlLink: string | null;
  status: string | null;
  allDay: boolean;
  start: string;
  end: string;
  accessRole: string;
  readOnly: boolean;
  backgroundColor: string | null;
};

/**
 * A Google event that was created as a Task work block (optional Google write).
 * Kept for API responses; the day Task lane uses local `scheduled_at` instead.
 */
export type CalendarTaskLink = {
  googleCalendarId: string;
  googleEventId: string;
  taskId: string;
  taskTitle: string;
  taskStatus: TaskStatus;
  taskPriority: TaskPriority;
};

/** Default duration when estimated_minutes is unset. */
export const DEFAULT_TASK_MINUTES = 30;

/** A Task work block on the day timeline (right lane). Source: Workspace DB. */
export type CalendarTaskBlock = {
  taskId: string;
  taskTitle: string;
  taskStatus: TaskStatus;
  taskPriority: TaskPriority;
  start: string;
  end: string;
};

export function taskWorkMinutes(
  task: Pick<WorkspaceTask, "estimated_minutes">,
): number {
  return task.estimated_minutes && task.estimated_minutes > 0
    ? task.estimated_minutes
    : DEFAULT_TASK_MINUTES;
}

export function taskToWorkBlock(
  task: WorkspaceTask,
): CalendarTaskBlock | null {
  if (!task.scheduled_at) return null;
  const startMs = Date.parse(task.scheduled_at);
  if (Number.isNaN(startMs)) return null;
  const mins = taskWorkMinutes(task);
  return {
    taskId: task.id,
    taskTitle: task.title,
    taskStatus: task.status,
    taskPriority: task.priority,
    start: new Date(startMs).toISOString(),
    end: new Date(startMs + mins * 60_000).toISOString(),
  };
}
