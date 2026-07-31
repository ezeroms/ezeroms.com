import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import type {
  TaskPriority,
  TaskStatus,
  WorkspaceTask,
} from "@/types/workspace";

const SELECT =
  "id, title, body_md, status, priority, project_id, scheduled_date, scheduled_at, due_at, estimated_minutes, location, created_at, updated_at, completed_at, archived_at";

export type TaskListFilter = {
  status?: TaskStatus;
  projectId?: string;
  scheduledDate?: string;
  /** Include tasks whose work block overlaps [from, to). */
  scheduledAtFrom?: string;
  scheduledAtTo?: string;
  /** overdue: due_at < now and not done/archived */
  view?: "inbox" | "today" | "upcoming" | "overdue" | "completed" | "all";
  includeArchived?: boolean;
  limit?: number;
};

export async function listTasks(
  filter: TaskListFilter = {},
): Promise<WorkspaceTask[]> {
  const limit = filter.limit ?? 100;
  let q = getWorkspaceAdmin()
    .from("tasks")
    .select(SELECT)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!filter.includeArchived) {
    q = q.is("archived_at", null).neq("status", "archived");
  }

  if (filter.status) {
    q = q.eq("status", filter.status);
  }
  if (filter.projectId) {
    q = q.eq("project_id", filter.projectId);
  }
  if (filter.scheduledDate) {
    q = q.eq("scheduled_date", filter.scheduledDate);
  }
  if (filter.scheduledAtFrom) {
    q = q.gte("scheduled_at", filter.scheduledAtFrom);
  }
  if (filter.scheduledAtTo) {
    q = q.lt("scheduled_at", filter.scheduledAtTo);
  }

  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  switch (filter.view) {
    case "inbox":
      q = q.eq("status", "inbox");
      break;
    case "today":
      q = q.eq("scheduled_date", today).neq("status", "done");
      break;
    case "upcoming":
      q = q
        .gt("scheduled_date", today)
        .neq("status", "done")
        .order("scheduled_date", { ascending: true });
      break;
    case "overdue":
      q = q
        .lt("due_at", nowIso)
        .neq("status", "done")
        .not("due_at", "is", null);
      break;
    case "completed":
      q = q.eq("status", "done");
      break;
    default:
      break;
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceTask[];
}

export async function getTask(id: string): Promise<WorkspaceTask | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("tasks")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WorkspaceTask | null) ?? null;
}

export type TaskWriteInput = {
  title: string;
  body_md?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  project_id?: string | null;
  scheduled_date?: string | null;
  scheduled_at?: string | null;
  due_at?: string | null;
  estimated_minutes?: number | null;
  location?: string | null;
};

function completedAtForStatus(
  status: TaskStatus | undefined,
  previous?: TaskStatus,
): string | null | undefined {
  if (!status) return undefined;
  if (status === "done") return new Date().toISOString();
  if (previous === "done") return null;
  return null;
}

export async function createTask(
  input: TaskWriteInput,
): Promise<WorkspaceTask> {
  const status = input.status ?? "inbox";
  const { data, error } = await getWorkspaceAdmin()
    .from("tasks")
    .insert({
      title: input.title,
      body_md: input.body_md ?? null,
      status,
      priority: input.priority ?? "none",
      project_id: input.project_id ?? null,
      scheduled_date: input.scheduled_date ?? null,
      scheduled_at: input.scheduled_at ?? null,
      due_at: input.due_at ?? null,
      estimated_minutes: input.estimated_minutes ?? null,
      location: input.location ?? null,
      completed_at: status === "done" ? new Date().toISOString() : null,
      archived_at: status === "archived" ? new Date().toISOString() : null,
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceTask;
}

export async function updateTask(
  id: string,
  patch: Partial<TaskWriteInput>,
): Promise<WorkspaceTask> {
  const existing = await getTask(id);
  if (!existing) throw new Error("Not found");

  const row: Record<string, unknown> = { ...patch };
  const completedAt = completedAtForStatus(patch.status, existing.status);
  if (completedAt !== undefined) {
    row.completed_at = completedAt;
  }
  if (patch.status === "archived") {
    row.archived_at = new Date().toISOString();
  } else if (patch.status) {
    row.archived_at = null;
  }

  const { data, error } = await getWorkspaceAdmin()
    .from("tasks")
    .update(row)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceTask;
}

export async function archiveTask(id: string): Promise<WorkspaceTask> {
  return updateTask(id, { status: "archived" });
}
