import { todayDateKey, type TaskViewId } from "@/lib/workspace/labels";
import { itemHasNoTags, itemHasTag } from "@/lib/workspace/tags";
import type { WorkspaceTask } from "@/types/workspace";

/** タスクボード左ナビの選択状態（スマートビュー or タグ） */
export type TasksNavSelection =
  | { kind: "view"; view: TaskViewId }
  | { kind: "tag"; tag: string };

/** ボード用スマートビューの日本語ラベル（URL 用の英語 TASK_VIEWS とは別） */
export const TASK_BOARD_VIEW_LABELS: Record<TaskViewId, string> = {
  all: "すべて",
  today: "今日",
  inbox: "Inbox",
  overdue: "期限切れ",
  completed: "完了",
};

export function isTaskOverdue(task: WorkspaceTask, now: Date): boolean {
  if (!task.due_at || task.status === "done") return false;
  const due = new Date(task.due_at);
  return !Number.isNaN(due.getTime()) && due < now;
}

/** 「N日遅れ」表示。期限切れでなければ null */
export function taskOverdueLabel(
  task: WorkspaceTask,
  now: Date,
): string | null {
  if (!isTaskOverdue(task, now) || !task.due_at) return null;
  const due = new Date(task.due_at);
  const days = Math.max(
    1,
    Math.floor((now.getTime() - due.getTime()) / 86_400_000),
  );
  return `${days}日遅れ`;
}

export function filterTasksForBoard(
  tasks: WorkspaceTask[],
  selection: TasksNavSelection,
  now: Date,
  options?: { includeCompleted?: boolean },
): WorkspaceTask[] {
  const today = todayDateKey(now);
  const includeCompleted = options?.includeCompleted ?? false;

  if (selection.kind === "tag") {
    return tasks.filter((task) => {
      if (!itemHasTag(task, selection.tag)) return false;
      return includeCompleted || task.status !== "done";
    });
  }

  switch (selection.view) {
    case "inbox":
      return tasks.filter((task) => {
        if (!itemHasNoTags(task)) return false;
        return includeCompleted || task.status !== "done";
      });
    case "today":
      return tasks.filter(
        (task) =>
          task.scheduled_date === today &&
          (includeCompleted || task.status !== "done"),
      );
    case "overdue":
      return tasks.filter((task) => isTaskOverdue(task, now));
    case "completed":
      return tasks.filter((task) => task.status === "done");
    case "all":
    default:
      return includeCompleted
        ? tasks
        : tasks.filter((task) => task.status !== "done");
  }
}

export function filterDoneTasksForBoard(
  tasks: WorkspaceTask[],
  selection: TasksNavSelection,
  now: Date,
): WorkspaceTask[] {
  if (selection.kind === "view" && selection.view === "completed") {
    return [];
  }
  return filterTasksForBoard(tasks, selection, now, {
    includeCompleted: true,
  }).filter((task) => task.status === "done");
}

export function countTasksForView(
  tasks: WorkspaceTask[],
  view: TaskViewId,
  now: Date,
): number {
  return filterTasksForBoard(tasks, { kind: "view", view }, now).length;
}

export function countTasksForTag(tasks: WorkspaceTask[], tag: string): number {
  return tasks.filter(
    (task) => itemHasTag(task, tag) && task.status !== "done",
  ).length;
}

export function tasksBoardSelectionTitle(selection: TasksNavSelection): string {
  if (selection.kind === "tag") return selection.tag;
  return TASK_BOARD_VIEW_LABELS[selection.view] ?? "Tasks";
}
