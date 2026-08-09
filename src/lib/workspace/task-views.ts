import { todayDateKey, type TaskViewId } from "@/lib/workspace/labels";
import type { WorkspaceProject, WorkspaceTask } from "@/types/workspace";

/** タスクボード左ナビの選択状態（スマートビュー or プロジェクト） */
export type TasksNavSelection =
  | { kind: "view"; view: TaskViewId }
  | { kind: "project"; projectId: string };

/** ボード用スマートビューの日本語ラベル（URL 用の英語 TASK_VIEWS とは別） */
export const TASK_BOARD_VIEW_LABELS: Record<TaskViewId, string> = {
  all: "すべて",
  today: "今日",
  upcoming: "近日",
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
): WorkspaceTask[] {
  const today = todayDateKey(now);

  if (selection.kind === "project") {
    return tasks.filter(
      (task) =>
        task.project_id === selection.projectId && task.status !== "done",
    );
  }

  switch (selection.view) {
    case "inbox":
      return tasks.filter((task) => task.status === "inbox");
    case "today":
      return tasks.filter(
        (task) => task.scheduled_date === today && task.status !== "done",
      );
    case "upcoming":
      return tasks
        .filter(
          (task) =>
            task.scheduled_date != null &&
            task.scheduled_date > today &&
            task.status !== "done",
        )
        .sort((a, b) =>
          (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? ""),
        );
    case "overdue":
      return tasks.filter((task) => isTaskOverdue(task, now));
    case "completed":
      return tasks.filter((task) => task.status === "done");
    case "all":
    default:
      return tasks.filter((task) => task.status !== "done");
  }
}

export function countTasksForView(
  tasks: WorkspaceTask[],
  view: TaskViewId,
  now: Date,
): number {
  return filterTasksForBoard(tasks, { kind: "view", view }, now).length;
}

export function tasksBoardSelectionTitle(
  selection: TasksNavSelection,
  projects: WorkspaceProject[],
): string {
  if (selection.kind === "project") {
    return (
      projects.find((project) => project.id === selection.projectId)?.name ??
      "Project"
    );
  }
  return TASK_BOARD_VIEW_LABELS[selection.view] ?? "Tasks";
}
