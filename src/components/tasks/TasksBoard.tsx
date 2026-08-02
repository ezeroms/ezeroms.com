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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { sidebarNavItemClass } from "@/lib/site/nav-styles";
import {
  formatShortDate,
  TASK_PRIORITY_LABELS,
  todayDateKey,
  type TaskViewId,
} from "@/lib/workspace/labels";
import type { WorkspaceProject, WorkspaceTask } from "@/types/workspace";

export type TasksNavSelection =
  | { kind: "view"; view: TaskViewId }
  | { kind: "project"; projectId: string };

const SMART_VIEWS: {
  id: TaskViewId;
  label: string;
  icon: typeof Inbox;
}[] = [
  { id: "all", label: "すべて", icon: ListTodo },
  { id: "today", label: "今日", icon: CalendarDays },
  { id: "upcoming", label: "近日", icon: CalendarDays },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "overdue", label: "期限切れ", icon: AlertCircle },
  { id: "completed", label: "完了", icon: CheckCircle2 },
];

type Props = {
  initialTasks: WorkspaceTask[];
  projects: WorkspaceProject[];
  initialSelection: TasksNavSelection;
  initialTaskId?: string | null;
};

function isOverdue(task: WorkspaceTask, now: Date): boolean {
  if (!task.due_at || task.status === "done") return false;
  const due = new Date(task.due_at);
  return !Number.isNaN(due.getTime()) && due < now;
}

function overdueLabel(task: WorkspaceTask, now: Date): string | null {
  if (!isOverdue(task, now) || !task.due_at) return null;
  const due = new Date(task.due_at);
  const days = Math.max(
    1,
    Math.floor((now.getTime() - due.getTime()) / 86_400_000),
  );
  return `${days}日遅れ`;
}

function filterTasks(
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
      return tasks.filter((task) => isOverdue(task, now));
    case "completed":
      return tasks.filter((task) => task.status === "done");
    case "all":
    default:
      return tasks.filter((task) => task.status !== "done");
  }
}

function countForView(
  tasks: WorkspaceTask[],
  view: TaskViewId,
  now: Date,
): number {
  return filterTasks(tasks, { kind: "view", view }, now).length;
}

function selectionTitle(
  selection: TasksNavSelection,
  projects: WorkspaceProject[],
): string {
  if (selection.kind === "project") {
    return (
      projects.find((project) => project.id === selection.projectId)?.name ??
      "Project"
    );
  }
  return SMART_VIEWS.find((view) => view.id === selection.view)?.label ?? "Tasks";
}

export function TasksBoard({
  initialTasks,
  projects: initialProjects,
  initialSelection,
  initialTaskId = null,
}: Props) {
  const router = useRouter();
  const [now] = useState(() => new Date());
  const [tasks, setTasks] = useState(initialTasks);
  const [projects, setProjects] = useState(initialProjects);
  const [selection, setSelection] =
    useState<TasksNavSelection>(initialSelection);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    initialTaskId,
  );
  const [quickTitle, setQuickTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  const visibleTasks = useMemo(
    () => filterTasks(tasks, selection, now),
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

  async function createProject() {
    const name = newProjectName.trim();
    if (!name || creatingProject) return;
    setCreatingProject(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/workspace/projects/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceProject;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "Project 作成に失敗しました");
      }
      setProjects((previous) => [data.item!, ...previous]);
      setNewProjectName("");
      selectNav({ kind: "project", projectId: data.item.id });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Project 作成に失敗しました",
      );
    } finally {
      setCreatingProject(false);
    }
  }

  const listTitle = selectionTitle(selection, projects);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
        {/* 左ペイン: スマートリスト / Projects（AdminSidebar と同じナビ見た目） */}
        <aside className="flex w-[13.5rem] shrink-0 flex-col border-r border-border bg-muted/30 sm:w-56">
          <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-4">
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              スマートリスト
            </p>
            <nav className="flex flex-col gap-0.5">
              {SMART_VIEWS.map((view) => {
                const Icon = view.icon;
                const active =
                  selection.kind === "view" && selection.view === view.id;
                const count = countForView(tasks, view.id, now);
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

            <div className="mt-3 flex items-center gap-1.5 px-0.5">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project を追加…"
                className="h-8 border-border bg-card text-xs shadow-none placeholder:text-muted-foreground/55"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void createProject();
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0"
                disabled={creatingProject || !newProjectName.trim()}
                onClick={() => void createProject()}
                aria-label="Project を追加"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* 中央ペイン: タスク一覧 */}
        <section className="flex min-w-0 flex-1 flex-col border-r border-border bg-card">
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
                const overdue = overdueLabel(task, now);
                return (
                  <li
                    key={task.id}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
                      active ? "bg-accent" : "hover:bg-muted/60",
                    )}
                  >
                    <TaskCheckbox
                      checked={task.status === "done"}
                      onChange={() => void toggleDone(task)}
                      className="mt-0.5"
                    />
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
      </div>

      {/* 右ペイン: 詳細編集 */}
      <section className="flex min-h-[42%] min-w-0 flex-1 flex-col border-t border-border bg-card lg:min-h-0 lg:max-w-[26rem] lg:border-l lg:border-t-0 xl:max-w-[28rem]">
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
            <ListTodo className="size-8 text-muted-foreground/35" aria-hidden />
            <p className="m-0 text-sm text-muted-foreground">
              タスクを選ぶと、ここで編集できます
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
