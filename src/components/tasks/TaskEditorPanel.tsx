"use client";

import { useEffect, useRef, useState } from "react";
import { Folder } from "lucide-react";
import { TaskCheckbox } from "@/components/tasks/TaskCheckbox";
import { TaskWorkBlocksSection } from "@/components/tasks/TaskWorkBlocksSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  fromDatetimeLocalValue,
  TASK_STATUS_LABELS,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import { cn } from "@/lib/cn";
import type {
  TaskStatus,
  WorkspaceProject,
  WorkspaceTask,
} from "@/types/workspace";

const AUTOSAVE_MS = 700;

const fieldClass =
  "h-8 border-border bg-card text-sm shadow-none focus-visible:border-border-hover";

type Draft = {
  title: string;
  body_md: string;
  status: TaskStatus;
  project_id: string;
  due_at: string;
  estimated_minutes: string;
  progress_percent: string;
  location: string;
};

function draftFromTask(task: WorkspaceTask): Draft {
  return {
    title: task.title,
    body_md: task.body_md ?? "",
    status: task.status,
    project_id: task.project_id ?? "",
    due_at: toDatetimeLocalValue(task.due_at),
    estimated_minutes:
      task.estimated_minutes != null ? String(task.estimated_minutes) : "",
    progress_percent: String(task.progress_percent ?? 0),
    location: task.location ?? "",
  };
}

function draftsEqual(a: Draft, b: Draft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

type Props = {
  task: WorkspaceTask;
  projects: WorkspaceProject[];
  onSaved: (task: WorkspaceTask) => void;
  onArchived: (taskId: string) => void;
};

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-b-0">
      <span className="w-[4.5rem] shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function TaskEditorPanel({
  task,
  projects,
  onSaved,
  onArchived,
}: Props) {
  const [draft, setDraft] = useState(() => draftFromTask(task));
  const [baseline, setBaseline] = useState(() => draftFromTask(task));
  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const taskIdRef = useRef(task.id);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    const next = draftFromTask(task);
    taskIdRef.current = task.id;
    setDraft(next);
    setBaseline(next);
    setSaveState("idle");
    setError(null);
  }, [task.id, task.updated_at]);

  function patchDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      setSaveState(draftsEqual(next, baseline) ? "saved" : "dirty");
      return next;
    });
  }

  async function persist(current: Draft): Promise<boolean> {
    const minutes = current.estimated_minutes.trim()
      ? Number(current.estimated_minutes)
      : null;
    if (minutes != null && (!Number.isFinite(minutes) || minutes <= 0)) {
      setError("見積もりは正の整数で入力してください");
      setSaveState("error");
      return false;
    }
    const progress = current.progress_percent.trim()
      ? Number(current.progress_percent)
      : 0;
    if (
      !Number.isFinite(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      setError("進捗は 0〜100 で入力してください");
      setSaveState("error");
      return false;
    }
    if (!current.title.trim()) {
      setError("タイトルは必須です");
      setSaveState("error");
      return false;
    }

    setSaveState("saving");
    setError(null);
    try {
      const response = await fetch(`/api/admin/workspace/tasks/${task.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: current.title.trim(),
          body_md: current.body_md,
          status: current.status,
          project_id: current.project_id || null,
          due_at: fromDatetimeLocalValue(current.due_at),
          estimated_minutes: minutes,
          progress_percent: Math.round(progress),
          location: current.location.trim() || null,
        }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceTask;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "保存に失敗しました");
      }
      if (taskIdRef.current !== task.id) return false;
      const savedDraft = draftFromTask(data.item);
      setBaseline(savedDraft);
      if (draftsEqual(draftRef.current, current)) {
        setDraft(savedDraft);
      }
      setSaveState("saved");
      onSaved(data.item);
      return true;
    } catch (err) {
      if (taskIdRef.current !== task.id) return false;
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setSaveState("error");
      return false;
    }
  }

  useEffect(() => {
    if (draftsEqual(draft, baseline)) return;
    const timer = window.setTimeout(() => {
      void persist(draft);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosave on draft only
  }, [draft]);

  async function toggleDone() {
    const nextStatus: TaskStatus =
      draft.status === "done" ? "active" : "done";
    const next = { ...draft, status: nextStatus };
    setDraft(next);
    setSaveState("dirty");
    await persist(next);
  }

  async function onArchive() {
    if (!confirm("この Task をアーカイブしますか？")) return;
    try {
      const response = await fetch(`/api/admin/workspace/tasks/${task.id}/`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "アーカイブに失敗しました");
      }
      onArchived(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "アーカイブに失敗しました");
    }
  }

  const dueIso = fromDatetimeLocalValue(draft.due_at);
  const dueOverdue =
    dueIso != null &&
    draft.status !== "done" &&
    new Date(dueIso) < new Date();

  const projectName =
    projects.find((p) => p.id === draft.project_id)?.name ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start gap-3 border-b border-border px-5 pb-4 pt-5">
        <TaskCheckbox
          checked={draft.status === "done"}
          onChange={() => void toggleDone()}
          size="md"
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <input
            value={draft.title}
            onChange={(e) => patchDraft("title", e.target.value)}
            className="admin-input-bare w-full border-0 bg-transparent text-lg font-semibold leading-snug tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
            placeholder="タイトル"
          />
          <p
            className={cn(
              "mt-1 text-[11px] transition-opacity duration-300",
              saveState === "idle" || saveState === "saved"
                ? "text-muted-foreground/50"
                : saveState === "error"
                  ? "text-red-600"
                  : "text-muted-foreground",
              saveState === "idle" && "opacity-0",
            )}
            aria-live="polite"
          >
            {saveState === "saving"
              ? "保存中…"
              : saveState === "dirty"
                ? "編集中"
                : saveState === "saved"
                  ? "保存済み"
                  : saveState === "error"
                    ? "エラー"
                    : "\u00a0"}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-1">
        <div className="mb-1">
          <MetaRow label="状態">
            <Select
              value={draft.status}
              onChange={(e) =>
                patchDraft("status", e.target.value as TaskStatus)
              }
              className={fieldClass}
            >
              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </MetaRow>
          <MetaRow label="期限">
            <Input
              type="datetime-local"
              value={draft.due_at}
              onChange={(e) => patchDraft("due_at", e.target.value)}
              className={cn(fieldClass, dueOverdue && "text-red-600")}
            />
          </MetaRow>
          <MetaRow label="進捗">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={draft.progress_percent}
                onChange={(e) =>
                  patchDraft("progress_percent", e.target.value)
                }
                className={cn(fieldClass, "max-w-[7rem]")}
              />
              <span className="text-xs text-muted-foreground">%</span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/70 transition-[width] duration-200"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, Number(draft.progress_percent) || 0),
                    )}%`,
                  }}
                />
              </div>
            </div>
          </MetaRow>
          <MetaRow label="見積もり">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                value={draft.estimated_minutes}
                onChange={(e) =>
                  patchDraft("estimated_minutes", e.target.value)
                }
                className={cn(fieldClass, "max-w-[7rem]")}
                placeholder="—"
              />
              <span className="text-xs text-muted-foreground">分</span>
            </div>
          </MetaRow>
          <MetaRow label="Project">
            <Select
              value={draft.project_id}
              onChange={(e) => patchDraft("project_id", e.target.value)}
              className={fieldClass}
            >
              <option value="">（なし）</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </MetaRow>
        </div>

        <TaskWorkBlocksSection taskId={task.id} />

        <div className="mt-5">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            メモ
          </p>
          <textarea
            value={draft.body_md}
            onChange={(e) => patchDraft("body_md", e.target.value)}
            className="min-h-[140px] w-full resize-none rounded-lg border border-border bg-accent/40 px-3 py-2.5 text-sm leading-relaxed text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus:border-border-hover"
            placeholder="タスク全体のメモ…"
          />
        </div>

        {error ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Folder className="size-3.5 shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{projectName ?? "Project なし"}</span>
        </span>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="h-8"
          onClick={() => void onArchive()}
        >
          アーカイブ
        </Button>
      </div>
    </div>
  );
}