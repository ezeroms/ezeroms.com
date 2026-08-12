"use client";

import { useEffect, useState, useRef } from "react";
import { TaskCheckbox } from "@/components/tasks/TaskCheckbox";
import { TaskWorkBlocksSection } from "@/components/tasks/TaskWorkBlocksSection";
import { Button } from "@/components/ui/button";
import {
  ClickToEditField,
  ClickToEditRow,
} from "@/components/ui/click-to-edit-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  endOfTodayDatetimeLocalValue,
  fromDatetimeLocalValue,
  TASK_STATUS_LABELS,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import {
  formatEstimatedMinutesInput,
  parseEstimatedMinutesInput,
  parseProgressPercentInput,
} from "@/lib/workspace/task-form";
import { cn } from "@/lib/cn";
import type {
  TaskStatus,
  WorkspaceProject,
  WorkspaceTask,
} from "@/types/workspace";

const AUTOSAVE_MS = 700;

const bareControlClass =
  "admin-input-bare h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0";

type Draft = {
  title: string;
  body_md: string;
  status: TaskStatus;
  project_id: string;
  due_at: string;
  estimated_minutes: string;
  progress_percent: string;
};

function draftFromTask(task: WorkspaceTask): Draft {
  return {
    title: task.title,
    body_md: task.body_md ?? "",
    status: task.status,
    project_id: task.project_id ?? "",
    due_at: toDatetimeLocalValue(task.due_at),
    estimated_minutes: formatEstimatedMinutesInput(task.estimated_minutes),
    progress_percent: String(task.progress_percent ?? 0),
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
  // 作業枠の合計分（実績）。子セクションから通知を受ける
  const [actualMinutes, setActualMinutes] = useState(0);
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
    setActualMinutes(0);
  }, [task.id, task.updated_at]);

  function patchDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      setSaveState(draftsEqual(next, baseline) ? "saved" : "dirty");
      return next;
    });
  }

  async function persist(current: Draft): Promise<boolean> {
    const minutesParsed = parseEstimatedMinutesInput(current.estimated_minutes);
    if (!minutesParsed.ok) {
      setError(minutesParsed.error);
      setSaveState("error");
      return false;
    }
    const progressParsed = parseProgressPercentInput(current.progress_percent);
    if (!progressParsed.ok) {
      setError(progressParsed.error);
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
          estimated_minutes: minutesParsed.value,
          progress_percent: progressParsed.value,
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
    const next = {
      ...draft,
      status: nextStatus,
      progress_percent: nextStatus === "done" ? "100" : draft.progress_percent,
    };
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start gap-3 border-b border-border px-5 pb-4 pt-6">
        <span className="mt-0.5 flex shrink-0 items-center">
          <TaskCheckbox
            checked={draft.status === "done"}
            onChange={() => void toggleDone()}
            size="md"
          />
        </span>
        <div className="min-w-0 flex-1">
          <ClickToEditField
            value={draft.title}
            emptyLabel="タイトル"
            required
            requiredMessage="タイトルは必須です"
            ariaLabel="タイトル"
            displayClassName="text-[1.15rem] font-semibold leading-snug tracking-tight text-foreground"
            onSave={async (next) => {
              patchDraft("title", next);
            }}
          />
          <div className="mt-2">
            <ClickToEditField
              value={draft.body_md}
              inputType="textarea"
              emptyLabel="詳細を追加"
              ariaLabel="詳細"
              displayClassName="text-sm leading-relaxed text-foreground"
              onSave={async (next) => {
                patchDraft("body_md", next);
              }}
            />
          </div>
          <p
            className={cn(
              "mt-1.5 text-[11px] transition-opacity duration-300",
              saveState === "idle" || saveState === "saved"
                ? "text-muted-foreground/45"
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

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-5">
        <div className="flex gap-3">
          <span className="w-5 shrink-0" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <ClickToEditRow label="状態" align="center">
            <Select
              value={draft.status}
              onChange={(e) => {
                const nextStatus = e.target.value as TaskStatus;
                setDraft((prev) => {
                  const next = {
                    ...prev,
                    status: nextStatus,
                    progress_percent:
                      nextStatus === "done" ? "100" : prev.progress_percent,
                  };
                  setSaveState(
                    draftsEqual(next, baseline) ? "saved" : "dirty",
                  );
                  return next;
                });
              }}
              className={bareControlClass}
            >
              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </ClickToEditRow>

          <ClickToEditRow label="期限" align="center">
            <div className="flex items-center gap-2">
              <Input
                type="datetime-local"
                value={draft.due_at}
                onChange={(e) => patchDraft("due_at", e.target.value)}
                className={cn(
                  bareControlClass,
                  "min-w-0 flex-1",
                  dueOverdue && "text-red-600",
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 shrink-0 px-2.5 text-xs"
                onClick={() =>
                  patchDraft("due_at", endOfTodayDatetimeLocalValue())
                }
              >
                今日中
              </Button>
            </div>
          </ClickToEditRow>

          <ClickToEditRow label="進捗" align="center">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={draft.progress_percent}
                onChange={(e) =>
                  patchDraft("progress_percent", e.target.value)
                }
                className={cn(bareControlClass, "w-10 shrink-0")}
              />
              <span className="text-sm text-muted-foreground">%</span>
              <div className="ml-2 h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/65 transition-[width] duration-200"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, Number(draft.progress_percent) || 0),
                    )}%`,
                  }}
                />
              </div>
            </div>
          </ClickToEditRow>

          <ClickToEditRow label="作業時間" align="center">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span className="text-sm text-muted-foreground">見積</span>
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                value={draft.estimated_minutes}
                onChange={(e) =>
                  patchDraft("estimated_minutes", e.target.value)
                }
                className={cn(bareControlClass, "w-12 shrink-0")}
                placeholder="—"
                aria-label="見積（分）"
              />
              <span className="text-sm text-muted-foreground">分</span>
              <span className="text-sm text-muted-foreground">
                （実績：{actualMinutes} 分）
              </span>
            </div>
          </ClickToEditRow>

          <ClickToEditRow label="Project" align="center">
            <Select
              value={draft.project_id}
              onChange={(e) => patchDraft("project_id", e.target.value)}
              className={bareControlClass}
            >
              <option value="">（なし）</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </ClickToEditRow>

          <ClickToEditRow label="作業枠">
            <TaskWorkBlocksSection
              taskId={task.id}
              embedded
              onActualMinutesChange={setActualMinutes}
            />
          </ClickToEditRow>
          </div>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-5 py-3.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-red-200 px-3 text-red-600 hover:border-red-500 hover:bg-red-50 hover:text-red-700"
          onClick={() => void onArchive()}
        >
          アーカイブ
        </Button>
      </div>
    </div>
  );
}
