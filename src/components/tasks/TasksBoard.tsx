"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Folder,
  Inbox,
  ListTodo,
  Plus,
} from "lucide-react";
import { TaskCheckbox } from "@/components/tasks/TaskCheckbox";
import { TaskEditorPanel } from "@/components/tasks/TaskEditorPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { cardOutlineClass } from "@/lib/site/card-styles";
import { sidebarNavItemClass } from "@/lib/site/nav-styles";
import {
  formatShortDate,
  TASK_PRIORITY_LABELS,
  type TaskViewId,
} from "@/lib/workspace/labels";
import {
  countTasksForView,
  filterTasksForBoard,
  taskOverdueLabel,
  TASK_BOARD_VIEW_LABELS,
  tasksBoardSelectionTitle,
  type TasksNavSelection,
} from "@/lib/workspace/task-views";
import type { WorkspaceProject, WorkspaceTask } from "@/types/workspace";

export type { TasksNavSelection };

const SMART_VIEWS: {
  id: TaskViewId;
  label: string;
  icon: typeof Inbox;
}[] = [
  { id: "all", label: TASK_BOARD_VIEW_LABELS.all, icon: ListTodo },
  { id: "today", label: TASK_BOARD_VIEW_LABELS.today, icon: CalendarDays },
  {
    id: "upcoming",
    label: TASK_BOARD_VIEW_LABELS.upcoming,
    icon: CalendarDays,
  },
  { id: "inbox", label: TASK_BOARD_VIEW_LABELS.inbox, icon: Inbox },
  {
    id: "overdue",
    label: TASK_BOARD_VIEW_LABELS.overdue,
    icon: AlertCircle,
  },
  {
    id: "completed",
    label: TASK_BOARD_VIEW_LABELS.completed,
    icon: CheckCircle2,
  },
];

type Props = {
  initialTasks: WorkspaceTask[];
  projects: WorkspaceProject[];
  initialSelection: TasksNavSelection;
  initialTaskId?: string | null;
};

export function TasksBoard({
  initialTasks,
  projects: initialProjects,
  initialSelection,
  initialTaskId = null,
}: Props) {
  const router = useRouter();
  const [now] = useState(() => new Date());
  const [tasks, setTasks] = useState(initialTasks);
  const [projects] = useState(initialProjects);
  const [selection, setSelection] =
    useState<TasksNavSelection>(initialSelection);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    initialTaskId,
  );
  const [quickTitle, setQuickTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleTasks = useMemo(
    () => filterTasksForBoard(tasks, selection, now),
    [tasks, selection, now],
  );

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  useEffect(() => {
    if (
      selectedTaskId &&
      visibleTasks.some((task) => task.id === selectedTaskId)
    ) {
      return;
    }
    setSelectedTaskId(visibleTasks[0]?.id ?? null);
  }, [selection, visibleTasks, selectedTaskId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selection.kind === "view") {
      params.set("view", selection.view);
    } else {
      params.set("project", selection.projectId);
    }
    if (selectedTaskId) params.set("task", selectedTaskId);
    const query = params.toString();
    router.replace(
      query ? `/admin/workspace/tasks/?${query}` : "/admin/workspace/tasks/",
      { scroll: false },
    );
  }, [selection, selectedTaskId, router]);

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status !== "archived"),
    [projects],
  );

  function selectNav(next: TasksNavSelection) {
    setSelection(next);
    setError(null);
  }

  async function onQuickAdd(event: FormEvent) {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title || busy) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        title,
        status:
          selection.kind === "view" && selection.view === "today"
            ? "active"
            : "inbox",
      };
      // 「今日」は作業枠で決まる。予定日だけの付与はしない。
      if (selection.kind === "project") {
        body.project_id = selection.projectId;
        body.status = "active";
      }
      const response = await fetch("/api/admin/workspace/tasks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        item?: WorkspaceTask;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "作成に失敗しました");
      }
      setQuickTitle("");
      setTasks((previous) => [data.item!, ...previous]);
      setSelectedTaskId(data.item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function toggleDone(task: WorkspaceTask) {
    const nextStatus = task.status === "done" ? "active" : "done";
    const nextProgress =
      nextStatus === "done" ? 100 : (task.progress_percent ?? 0);
    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id
          ? { ...item, status: nextStatus, progress_percent: nextProgress }
          : item,
      ),
    );
    try {
      const response = await fetch(`/api/admin/workspace/tasks/${task.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          ...(nextStatus === "done" ? { progress_percent: 100 } : {}),
        }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceTask;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "更新に失敗しました");
      }
      setTasks((previous) =>
        previous.map((item) => (item.id === task.id ? data.item! : item)),
      );
    } catch (err) {
      setTasks((previous) =>
        previous.map((item) => (item.id === task.id ? task : item)),
      );
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  const listTitle = tasksBoardSelectionTitle(selection, projects);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-background lg:flex-row">
      {/* 左ペイン: スマートリスト / Projects（AdminSidebar と同じナビ見た目） */}
      <aside className="flex max-h-[40%] w-full shrink-0 flex-col border-b border-border bg-background lg:max-h-none lg:w-56 lg:border-b-0 lg:border-r">
        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-4">
          <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            スマートリスト
          </p>
          <nav className="flex flex-col gap-0.5">
            {SMART_VIEWS.map((view) => {
              const Icon = view.icon;
              const active =
                selection.kind === "view" && selection.view === view.id;
              const count = countTasksForView(tasks, view.id, now);
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => selectNav({ kind: "view", view: view.id })}
                  className={sidebarNavItemClass(active)}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{view.label}</span>
                  {count > 0 ? (
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mb-1.5 mt-5 flex items-center justify-between gap-2 px-2">
            <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Projects
            </p>
            <Link
              href="/admin/workspace/projects/"
              className="border-0 bg-transparent p-0 text-[11px] text-muted-foreground shadow-none transition-colors hover:text-foreground"
            >
              管理
            </Link>
          </div>
          <nav className="flex flex-col gap-0.5">
            {activeProjects.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                まだありません
              </p>
            ) : (
              activeProjects.map((project) => {
                const active =
                  selection.kind === "project" &&
                  selection.projectId === project.id;
                const count = tasks.filter(
                  (task) =>
                    task.project_id === project.id && task.status !== "done",
                ).length;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() =>
                      selectNav({ kind: "project", projectId: project.id })
                    }
                    className={sidebarNavItemClass(active)}
                  >
                    <Folder
                      className="h-4 w-4 shrink-0 opacity-80"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {project.name}
                    </span>
                    {count > 0 ? (
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </nav>
        </div>
      </aside>

      {/* 右領域: 背景上のカード（領域幅いっぱい＋適切な余白、中でスクロール） */}
      <div className="flex h-full min-h-0 min-w-0 flex-1 basis-0 flex-col p-3 sm:p-4">
        <div className={cn(
          "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-card lg:flex-row",
          cardOutlineClass,
        )}>
          {/* タスク一覧（やや狭め・詳細側に余白を寄せる） */}
          <section className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col lg:max-w-[22rem] lg:flex-none lg:basis-[22rem] xl:max-w-[24rem] xl:basis-[24rem]">
            <div className="shrink-0 px-5 pb-3 pt-6">
              <h1 className="m-0 text-[1.35rem] font-semibold tracking-tight text-foreground">
                {listTitle}
              </h1>
              <p className="m-0 mt-1 text-xs text-muted-foreground">
                {visibleTasks.length} 件
              </p>
            </div>

            <form
              onSubmit={onQuickAdd}
              className="mx-5 mb-3 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors focus-within:border-border-hover"
            >
              <Plus
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="タスクを追加…"
                className="admin-input-bare h-8 min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/65"
                autoComplete="off"
                enterKeyHint="done"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={busy || !quickTitle.trim()}
                className="h-8 shrink-0 px-3"
              >
                {busy ? "…" : "追加"}
              </Button>
            </form>

            {error ? (
              <p
                className="m-0 shrink-0 px-5 py-2 text-sm text-red-600"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <ul className="m-0 min-h-0 flex-1 list-none space-y-1 overflow-y-auto px-3 pb-5 pt-1">
              {visibleTasks.length === 0 ? (
                <li className="px-3 py-20 text-center text-sm text-muted-foreground">
                  タスクはありません
                </li>
              ) : (
                visibleTasks.map((task) => {
                  const active = task.id === selectedTaskId;
                  const overdue = taskOverdueLabel(task, now);
                  return (
                    <li
                      key={task.id}
                      className={cn(
                        "group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
                        active ? "bg-accent" : "hover:bg-muted/60",
                      )}
                    >
                      <span className="flex h-[1.375em] shrink-0 items-center text-sm leading-snug">
                        <TaskCheckbox
                          checked={task.status === "done"}
                          onChange={() => void toggleDone(task)}
                        />
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTaskId(task.id)}
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-left shadow-none outline-none focus-visible:outline-none"
                      >
                        <span
                          className={cn(
                            "block text-sm font-medium leading-snug text-foreground",
                            task.status === "done" &&
                              "font-normal text-muted-foreground line-through",
                          )}
                        >
                          {task.title}
                        </span>
                        {(task.priority !== "none" ||
                          task.scheduled_date ||
                          (task.progress_percent ?? 0) > 0 ||
                          overdue ||
                          task.due_at) && (
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                            {task.priority !== "none" ? (
                              <span>{TASK_PRIORITY_LABELS[task.priority]}</span>
                            ) : null}
                            {(task.progress_percent ?? 0) > 0 ? (
                              <span>{task.progress_percent}%</span>
                            ) : null}
                            {task.scheduled_date ? (
                              <span>
                                作業 {formatShortDate(task.scheduled_date)}
                              </span>
                            ) : null}
                            {overdue ? (
                              <span className="font-medium text-red-600">
                                {overdue}
                              </span>
                            ) : task.due_at ? (
                              <span>
                                期限 {formatShortDate(task.due_at)}
                              </span>
                            ) : null}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          {/* 一覧 / 詳細の区切り（section の border だと外枠と二重になる） */}
          <div
            className="h-px w-full shrink-0 bg-border lg:h-auto lg:w-px lg:self-stretch"
            aria-hidden
          />

          {/* 詳細編集（一覧より広め） */}
          <section className="flex min-h-[42%] w-full min-w-0 flex-1 basis-0 flex-col lg:min-h-0">
            {selectedTask ? (
              <TaskEditorPanel
                key={selectedTask.id}
                task={selectedTask}
                projects={projects}
                onSaved={(saved) => {
                  setTasks((previous) =>
                    previous.map((item) =>
                      item.id === saved.id ? saved : item,
                    ),
                  );
                }}
                onArchived={(taskId) => {
                  setTasks((previous) =>
                    previous.filter((item) => item.id !== taskId),
                  );
                  setSelectedTaskId(null);
                }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
                <ListTodo
                  className="size-8 text-muted-foreground/35"
                  aria-hidden
                />
                <p className="m-0 text-sm text-muted-foreground">
                  タスクを選ぶと、ここで編集できます
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
