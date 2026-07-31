"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  formatShortDate,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_VIEWS,
  type TaskViewId,
} from "@/lib/workspace/labels";
import type { WorkspaceProject, WorkspaceTask } from "@/types/workspace";

type Props = {
  initialTasks: WorkspaceTask[];
  projects: WorkspaceProject[];
  initialView: TaskViewId;
};

export function TasksBoard({ initialTasks, projects, initialView }: Props) {
  const router = useRouter();
  const [view, setView] = useState<TaskViewId>(initialView);
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  const projectName = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p.name]));
    return (id: string | null) => (id ? map.get(id) ?? null : null);
  }, [projects]);

  async function loadView(next: TaskViewId) {
    setView(next);
    setLoadingView(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/workspace/tasks/?view=${encodeURIComponent(next)}&limit=200`,
      );
      const data = (await res.json()) as {
        items?: WorkspaceTask[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "読み込みに失敗しました");
      setTasks(data.items ?? []);
      router.replace(`/admin/workspace/tasks/?view=${next}`, { scroll: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoadingView(false);
    }
  }

  async function onQuickAdd(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        title: t,
        status: view === "today" ? "active" : "inbox",
      };
      if (view === "today") {
        const d = new Date();
        body.scheduled_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
      const res = await fetch("/api/admin/workspace/tasks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        item?: WorkspaceTask;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "作成に失敗しました");
      setTitle("");
      if (data.item) {
        setTasks((prev) => [data.item!, ...prev]);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function toggleDone(task: WorkspaceTask) {
    const nextStatus = task.status === "done" ? "active" : "done";
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: nextStatus } : t,
      ),
    );
    try {
      const res = await fetch(`/api/admin/workspace/tasks/${task.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await res.json()) as {
        item?: WorkspaceTask;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "更新に失敗しました");
      if (data.item) {
        setTasks((prev) => {
          const updated = prev.map((t) =>
            t.id === task.id ? data.item! : t,
          );
          if (view === "completed") {
            return updated.filter((t) => t.status === "done");
          }
          if (view !== "all" && nextStatus === "done") {
            return updated.filter((t) => t.id !== task.id);
          }
          return updated;
        });
      }
      router.refresh();
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? task : t)),
      );
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {TASK_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => loadView(v.id)}
            className={cn(
              "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
              view === v.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-border-hover hover:text-foreground",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={onQuickAdd}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            view === "today"
              ? "今日の Task を追加…"
              : "新しい Task を Inbox に追加…"
          }
          className="flex-1"
          autoComplete="off"
          enterKeyHint="done"
        />
        <Button type="submit" disabled={busy || !title.trim()} className="sm:w-auto">
          {busy ? "追加中…" : "追加"}
        </Button>
      </form>

      {error ? (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {loadingView ? (
          <li className="px-1 py-6 text-sm text-muted-foreground">読み込み中…</li>
        ) : tasks.length === 0 ? (
          <li className="px-1 py-6 text-sm text-muted-foreground">
            Task はまだありません。上の欄から追加できます。
          </li>
        ) : (
          tasks.map((task) => {
            const pn = projectName(task.project_id);
            return (
              <li
                key={task.id}
                className="flex items-start gap-2 rounded-md border border-transparent px-1 py-2 hover:border-border hover:bg-black/[0.02]"
              >
                <input
                  type="checkbox"
                  className="mt-1.5 h-4 w-4 shrink-0 cursor-pointer accent-foreground"
                  checked={task.status === "done"}
                  onChange={() => toggleDone(task)}
                  aria-label="完了"
                />
                <Link
                  href={`/admin/workspace/tasks/${task.id}/`}
                  className="min-w-0 flex-1 no-underline"
                >
                  <div
                    className={cn(
                      "text-sm font-medium text-foreground",
                      task.status === "done" && "text-muted-foreground line-through",
                    )}
                  >
                    {task.title}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{TASK_STATUS_LABELS[task.status] ?? task.status}</span>
                    {task.priority !== "none" ? (
                      <span>{TASK_PRIORITY_LABELS[task.priority]}</span>
                    ) : null}
                    {task.scheduled_date ? (
                      <span>予定 {formatShortDate(task.scheduled_date)}</span>
                    ) : null}
                    {task.due_at ? (
                      <span>期限 {formatShortDate(task.due_at)}</span>
                    ) : null}
                    {pn ? <span>{pn}</span> : null}
                  </div>
                </Link>
              </li>
            );
          })
        )}
      </ul>

      {projects.length === 0 ? (
        <p className="m-0 text-xs text-muted-foreground">
          Project は Task / Doc の詳細画面から作成できます。
        </p>
      ) : null}
    </div>
  );
}
