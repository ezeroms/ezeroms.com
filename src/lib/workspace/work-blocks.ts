import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import { localDateKeyFromIso } from "@/lib/workspace/calendar/time";
import { DEFAULT_TASK_MINUTES } from "@/types/calendar";
import type { TaskWorkBlock, WorkspaceTask } from "@/types/workspace";

const TASK_SELECT =
  "id, title, body_md, status, priority, project_id, scheduled_date, scheduled_at, due_at, estimated_minutes, progress_percent, created_at, updated_at, completed_at, archived_at";

const SELECT =
  "id, task_id, starts_at, ends_at, calendar_link_id, note_md, created_at, updated_at";

export type TaskWorkBlockWrite = {
  taskId: string;
  startsAt: string;
  endsAt: string;
  calendarLinkId?: string | null;
  noteMd?: string | null;
};

export type TaskWorkBlockWithTask = TaskWorkBlock & {
  task: Pick<
    WorkspaceTask,
    "id" | "title" | "status" | "priority" | "estimated_minutes"
  >;
};

function assertRange(startsAt: string, endsAt: string) {
  const startMs = Date.parse(startsAt);
  const endMs = Date.parse(endsAt);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    throw new Error("starts_at / ends_at must be ISO datetimes");
  }
  if (endMs <= startMs) {
    throw new Error("ends_at must be after starts_at");
  }
}

export async function listWorkBlocksForTask(
  taskId: string,
): Promise<TaskWorkBlock[]> {
  const { data, error } = await getWorkspaceAdmin()
    .from("task_work_blocks")
    .select(SELECT)
    .eq("task_id", taskId)
    .order("starts_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TaskWorkBlock[];
}

/**
 * 表示期間と重なる作業枠（タスク情報付き）。
 * overlap: starts_at < timeMax AND ends_at > timeMin
 */
export async function listWorkBlocksInRange(input: {
  timeMin: string;
  timeMax: string;
  limit?: number;
}): Promise<TaskWorkBlockWithTask[]> {
  const limit = input.limit ?? 400;
  const { data, error } = await getWorkspaceAdmin()
    .from("task_work_blocks")
    .select(
      `${SELECT}, task:tasks (id, title, status, priority, estimated_minutes)`,
    )
    .lt("starts_at", input.timeMax)
    .gt("ends_at", input.timeMin)
    .order("starts_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);

  type Row = TaskWorkBlock & {
    task:
      | TaskWorkBlockWithTask["task"]
      | TaskWorkBlockWithTask["task"][]
      | null;
  };

  return ((data ?? []) as unknown as Row[]).flatMap((row) => {
    const task = Array.isArray(row.task) ? row.task[0] : row.task;
    if (!task || task.status === "archived") return [];
    const { task: _t, ...block } = row;
    return [{ ...(block as TaskWorkBlock), task }];
  });
}

async function patchTaskSchedule(
  taskId: string,
  scheduledAt: string | null,
  scheduledDate: string | null,
): Promise<WorkspaceTask> {
  const { data, error } = await getWorkspaceAdmin()
    .from("tasks")
    .update({
      scheduled_at: scheduledAt,
      scheduled_date: scheduledDate,
    })
    .eq("id", taskId)
    .select(TASK_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceTask;
}

/** tasks.scheduled_at / scheduled_date を作業枠から同期（次の枠＝現在以降で最も早い開始）。 */
export async function syncTaskScheduleFromBlocks(
  taskId: string,
): Promise<WorkspaceTask> {
  const blocks = await listWorkBlocksForTask(taskId);
  if (blocks.length === 0) {
    // 作業枠なし → 代表の予定日/開始もクリア（予定日は作業枠由来のみ）
    return patchTaskSchedule(taskId, null, null);
  }

  const now = Date.now();
  const sorted = [...blocks].sort((a, b) =>
    a.starts_at.localeCompare(b.starts_at),
  );
  const next =
    sorted.find((b) => Date.parse(b.ends_at) > now) ?? sorted[sorted.length - 1];

  return patchTaskSchedule(
    taskId,
    next.starts_at,
    localDateKeyFromIso(next.starts_at),
  );
}

export async function createWorkBlock(
  input: TaskWorkBlockWrite,
): Promise<TaskWorkBlock> {
  assertRange(input.startsAt, input.endsAt);
  const { data, error } = await getWorkspaceAdmin()
    .from("task_work_blocks")
    .insert({
      task_id: input.taskId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      calendar_link_id: input.calendarLinkId ?? null,
      note_md: input.noteMd ?? null,
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  await syncTaskScheduleFromBlocks(input.taskId);
  return data as TaskWorkBlock;
}

export async function updateWorkBlock(
  id: string,
  patch: Partial<{
    startsAt: string;
    endsAt: string;
    calendarLinkId: string | null;
    noteMd: string | null;
  }>,
): Promise<TaskWorkBlock> {
  const existing = await getWorkBlock(id);
  if (!existing) throw new Error("Not found");

  const startsAt = patch.startsAt ?? existing.starts_at;
  const endsAt = patch.endsAt ?? existing.ends_at;
  assertRange(startsAt, endsAt);

  const row: Record<string, unknown> = {};
  if (patch.startsAt !== undefined) row.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) row.ends_at = patch.endsAt;
  if (patch.calendarLinkId !== undefined) {
    row.calendar_link_id = patch.calendarLinkId;
  }
  if (patch.noteMd !== undefined) row.note_md = patch.noteMd;

  const { data, error } = await getWorkspaceAdmin()
    .from("task_work_blocks")
    .update(row)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);

  await syncTaskScheduleFromBlocks(existing.task_id);
  return data as TaskWorkBlock;
}

export async function deleteWorkBlock(id: string): Promise<void> {
  const existing = await getWorkBlock(id);
  if (!existing) throw new Error("Not found");

  const { error } = await getWorkspaceAdmin()
    .from("task_work_blocks")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  await syncTaskScheduleFromBlocks(existing.task_id);
}

export async function getWorkBlock(
  id: string,
): Promise<TaskWorkBlock | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("task_work_blocks")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TaskWorkBlock | null) ?? null;
}

/**
 * Task の scheduled_at 変更を 0〜1 枠の作業枠へミラーする。
 * 複数枠がある場合は作業枠を壊さない（scheduled_at だけ更新済み前提）。
 */
export async function mirrorScheduledAtToWorkBlocks(
  taskId: string,
  scheduledAt: string | null,
  estimatedMinutes?: number | null,
): Promise<void> {
  const blocks = await listWorkBlocksForTask(taskId);
  if (blocks.length > 1) {
    await syncTaskScheduleFromBlocks(taskId);
    return;
  }

  if (scheduledAt == null) {
    if (blocks.length === 1) {
      await deleteWorkBlock(blocks[0].id);
    } else {
      await syncTaskScheduleFromBlocks(taskId);
    }
    return;
  }

  const { data: taskRow } = await getWorkspaceAdmin()
    .from("tasks")
    .select("estimated_minutes")
    .eq("id", taskId)
    .maybeSingle();
  const taskMins = (taskRow as { estimated_minutes: number | null } | null)
    ?.estimated_minutes;
  const mins =
    (estimatedMinutes && estimatedMinutes > 0
      ? estimatedMinutes
      : null) ??
    (taskMins && taskMins > 0 ? taskMins : DEFAULT_TASK_MINUTES);
  const endsAt = new Date(
    Date.parse(scheduledAt) + mins * 60_000,
  ).toISOString();

  if (blocks.length === 0) {
    await createWorkBlock({
      taskId,
      startsAt: scheduledAt,
      endsAt,
    });
    return;
  }

  await updateWorkBlock(blocks[0].id, {
    startsAt: scheduledAt,
    endsAt,
  });
}