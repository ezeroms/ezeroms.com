"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  endOfTodayDatetimeLocalValue,
  fromDatetimeLocalValue,
  TASK_STATUS_LABELS,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import type {
  TaskStatus,
  WorkspaceProject,
  WorkspaceTask,
} from "@/types/workspace";

type Props = {
  open: boolean;
  taskId: string | null;
  /** カレンダー上の作業枠をクリックしたとき */
  workBlockId?: string | null;
  initialWorkBlock?: { starts_at: string; ends_at: string } | null;
  /** Optional seed while the latest task is loading. */
  initialTask?: WorkspaceTask | null;
  onClose: () => void;
  onSaved: (
    task: WorkspaceTask,
    workBlock?: { id: string; starts_at: string; ends_at: string },
  ) => void;
  onArchived: (taskId: string) => void;
  /** 作業枠だけ削除したとき（タスク自体は残す） */
  onWorkBlockDeleted?: (workBlockId: string) => void;
};

type FormState = {
  title: string;
  bodyMd: string;
  status: TaskStatus;
  projectId: string;
  dueAt: string;
  estimatedMinutes: string;
  progressPercent: string;
  location: string;
  workStartsAt: string;
  workEndsAt: string;
  /** 作業枠の日誌（Markdown） */
  workNoteMd: string;
};

type WorkSeed = {
  starts_at: string;
  ends_at: string;
  note_md?: string | null;
};

function formatEstimatedMinutes(
  value: WorkspaceTask["estimated_minutes"],
): string {
  if (value == null) return "";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.round(n));
}

function formFromTask(
  task: WorkspaceTask,
  work?: WorkSeed | null,
): FormState {
  return {
    title: task.title,
    bodyMd: task.body_md ?? "",
    status: task.status,
    projectId: task.project_id ?? "",
    dueAt: toDatetimeLocalValue(task.due_at),
    estimatedMinutes: formatEstimatedMinutes(task.estimated_minutes),
    progressPercent: String(task.progress_percent ?? 0),
    location: task.location ?? "",
    workStartsAt: toDatetimeLocalValue(work?.starts_at ?? null),
    workEndsAt: toDatetimeLocalValue(work?.ends_at ?? null),
    workNoteMd: work?.note_md ?? "",
  };
}

export function TaskEditModal({
  open,
  taskId,
  workBlockId = null,
  initialWorkBlock = null,
  initialTask = null,
  onClose,
  onSaved,
  onArchived,
  onWorkBlockDeleted,
}: Props) {
  const formId = useId();
  const editingWorkBlock = Boolean(workBlockId || initialWorkBlock);
  const [task, setTask] = useState<WorkspaceTask | null>(initialTask);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [resolvedWorkBlockId, setResolvedWorkBlockId] = useState<string | null>(
    workBlockId,
  );
  const [form, setForm] = useState<FormState | null>(
    initialTask ? formFromTask(initialTask, initialWorkBlock) : null,
  );
  const [baseline, setBaseline] = useState<FormState | null>(
    initialTask ? formFromTask(initialTask, initialWorkBlock) : null,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !taskId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDeletingBlock(false);
    setResolvedWorkBlockId(workBlockId);
    setProjects([]);
    // タイトル表示用のみ先行セット。form は API 完了まで出さない
    // （projects 未取得のまま Select を出すと value が「なし」に落ちることがある）
    if (initialTask && initialTask.id === taskId) {
      setTask(initialTask);
    } else {
      setTask(null);
    }
    setForm(null);
    setBaseline(null);

    const seedWorkBlock = initialWorkBlock;
    const seedWorkBlockId = workBlockId;

    void (async () => {
      try {
        const [taskRes, projectsRes] = await Promise.all([
          fetch(`/api/admin/workspace/tasks/${taskId}/`),
          fetch("/api/admin/workspace/projects/?include_archived=1"),
        ]);
        const taskData = (await taskRes.json()) as {
          item?: WorkspaceTask;
          error?: string;
        };
        const projectsData = (await projectsRes.json()) as {
          items?: WorkspaceProject[];
          error?: string;
        };
        if (!taskRes.ok || !taskData.item) {
          throw new Error(taskData.error || "タスクの取得に失敗しました");
        }
        if (!projectsRes.ok) {
          throw new Error(projectsData.error || "Project の取得に失敗しました");
        }

        let work: WorkSeed | null | undefined = seedWorkBlock;
        let blockId = seedWorkBlockId;
        if (seedWorkBlockId) {
          const blockRes = await fetch(
            `/api/admin/workspace/work-blocks/${seedWorkBlockId}/`,
          );
          const blockData = (await blockRes.json()) as {
            item?: {
              id: string;
              starts_at: string;
              ends_at: string;
              note_md?: string | null;
            };
            error?: string;
          };
          if (blockRes.ok && blockData.item) {
            work = {
              starts_at: blockData.item.starts_at,
              ends_at: blockData.item.ends_at,
              note_md: blockData.item.note_md ?? "",
            };
            blockId = blockData.item.id;
          }
        }

        if (cancelled) return;

        let projectItems = projectsData.items ?? [];
        const projectId = taskData.item.project_id;
        if (
          projectId &&
          !projectItems.some((project) => project.id === projectId)
        ) {
          const projectRes = await fetch(
            `/api/admin/workspace/projects/${projectId}/`,
          );
          const projectData = (await projectRes.json()) as {
            item?: WorkspaceProject;
          };
          if (projectRes.ok && projectData.item) {
            projectItems = [projectData.item, ...projectItems];
          }
        }

        // 編集用はアーカイブ以外を優先表示（現在紐づいているものは残す）
        const selectable = projectItems.filter(
          (project) =>
            project.status !== "archived" || project.id === projectId,
        );

        const next = formFromTask(taskData.item, work);
        setTask(taskData.item);
        setProjects(selectable);
        setResolvedWorkBlockId(blockId);
        setForm(next);
        setBaseline(next);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "読み込みに失敗しました",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // initialTask / initialWorkBlock は意図的に依存から外す（上記コメント参照）
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed only on open/task/block
  }, [open, taskId, workBlockId]);

  const dirty = useMemo(() => {
    if (!form || !baseline) return false;
    return JSON.stringify(form) !== JSON.stringify(baseline);
  }, [form, baseline]);

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!task || !form || saving || archiving || deletingBlock) return;
    setSaving(true);
    setError(null);
    try {
      const minutes = form.estimatedMinutes.trim()
        ? Number(form.estimatedMinutes)
        : null;
      if (minutes != null && (!Number.isFinite(minutes) || minutes <= 0)) {
        throw new Error("見積もりは正の整数で入力してください");
      }
      const progress = form.progressPercent.trim()
        ? Number(form.progressPercent)
        : 0;
      if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
        throw new Error("進捗は 0〜100 で入力してください");
      }

      let savedBlock:
        | { id: string; starts_at: string; ends_at: string }
        | undefined;

      if (editingWorkBlock) {
        const startsAt = fromDatetimeLocalValue(form.workStartsAt);
        const endsAt = fromDatetimeLocalValue(form.workEndsAt);
        if (!startsAt || !endsAt) {
          throw new Error("作業枠の開始・終了を入力してください");
        }
        if (Date.parse(endsAt) <= Date.parse(startsAt)) {
          throw new Error("終了は開始より後にしてください");
        }

        if (resolvedWorkBlockId) {
          const blockRes = await fetch(
            `/api/admin/workspace/work-blocks/${resolvedWorkBlockId}/`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                starts_at: startsAt,
                ends_at: endsAt,
                note_md: form.workNoteMd.trim() || null,
              }),
            },
          );
          const blockData = (await blockRes.json()) as {
            item?: {
              id: string;
              starts_at: string;
              ends_at: string;
              note_md?: string | null;
            };
            error?: string;
          };
          if (!blockRes.ok || !blockData.item) {
            throw new Error(blockData.error || "作業枠の保存に失敗しました");
          }
          savedBlock = blockData.item;
        }
      }

      const res = await fetch(`/api/admin/workspace/tasks/${task.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          body_md: form.bodyMd,
          status: form.status,
          project_id: form.projectId || null,
          due_at: fromDatetimeLocalValue(form.dueAt),
          estimated_minutes: minutes,
          progress_percent:
            form.status === "done" ? 100 : Math.round(progress),
          location: form.location.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        item?: WorkspaceTask;
        error?: string;
      };
      if (!res.ok || !data.item) {
        throw new Error(data.error || "保存に失敗しました");
      }
      const next = formFromTask(
        data.item,
        savedBlock
          ? {
              starts_at: savedBlock.starts_at,
              ends_at: savedBlock.ends_at,
              note_md: form.workNoteMd,
            }
          : editingWorkBlock
            ? {
                starts_at: fromDatetimeLocalValue(form.workStartsAt)!,
                ends_at: fromDatetimeLocalValue(form.workEndsAt)!,
                note_md: form.workNoteMd,
              }
            : null,
      );
      setTask(data.item);
      setForm(next);
      setBaseline(next);
      onSaved(data.item, savedBlock);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function onArchive() {
    if (!task || saving || archiving || deletingBlock) return;
    if (!confirm("この Task をアーカイブしますか？")) return;
    setArchiving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workspace/tasks/${task.id}/`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "アーカイブに失敗しました");
      onArchived(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "アーカイブに失敗しました");
      setArchiving(false);
    }
  }

  async function onDeleteWorkBlock() {
    if (!resolvedWorkBlockId || saving || archiving || deletingBlock) return;
    if (!confirm("この作業枠を削除しますか？")) return;
    setDeletingBlock(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/workspace/work-blocks/${resolvedWorkBlockId}/`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "作業枠の削除に失敗しました");
      onWorkBlockDeleted?.(resolvedWorkBlockId);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "作業枠の削除に失敗しました",
      );
      setDeletingBlock(false);
    }
  }

  return (
    <AdminContentModal
      open={open}
      onClose={onClose}
      title={
        editingWorkBlock
          ? task?.title
            ? `作業枠: ${task.title}`
            : "作業枠"
          : task?.title
            ? `Task: ${task.title}`
            : "Task"
      }
      formId={formId}
      isEdit
      saving={saving}
      dirty={dirty && Boolean(form?.title.trim())}
      deleting={archiving}
      deleteError={error}
      onDelete={onArchive}
      updateLabel="保存"
      maxWidthClassName="max-w-2xl"
      maxHeightClassName="max-h-[min(90vh,48rem)]"
    >
      {loading ? (
        <p className="m-0 text-sm text-muted-foreground">読み込み中…</p>
      ) : form ? (
        <form id={formId} onSubmit={onSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-task-title">タイトル</Label>
            <Input
              id="cal-task-title"
              value={form.title}
              onChange={(e) => patchForm("title", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cal-task-status">状態</Label>
              <Select
                id="cal-task-status"
                value={form.status}
                onChange={(e) => {
                  const nextStatus = e.target.value as TaskStatus;
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          status: nextStatus,
                          progressPercent:
                            nextStatus === "done"
                              ? "100"
                              : prev.progressPercent,
                        }
                      : prev,
                  );
                }}
              >
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cal-task-due">期限</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cal-task-due"
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(e) => patchForm("dueAt", e.target.value)}
                  className="min-w-0 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 shrink-0"
                  onClick={() =>
                    patchForm("dueAt", endOfTodayDatetimeLocalValue())
                  }
                >
                  今日中
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cal-task-progress">進捗（%）</Label>
              <div className="flex items-center gap-2.5">
                <Input
                  id="cal-task-progress"
                  type="number"
                  min={0}
                  max={100}
                  inputMode="numeric"
                  value={form.progressPercent}
                  onChange={(e) =>
                    patchForm("progressPercent", e.target.value)
                  }
                  className="max-w-[5.5rem]"
                />
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/65 transition-[width] duration-200"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, Number(form.progressPercent) || 0),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cal-task-estimate">見積もり（分）</Label>
              <Input
                id="cal-task-estimate"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.estimatedMinutes}
                onChange={(e) => patchForm("estimatedMinutes", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="cal-task-location">場所</Label>
              <Input
                id="cal-task-location"
                value={form.location}
                onChange={(e) => patchForm("location", e.target.value)}
              />
            </div>
          </div>

          {editingWorkBlock ? (
            <div className="rounded-md border border-border bg-accent/40 p-3">
              <p className="m-0 mb-3 text-xs font-medium text-muted-foreground">
                この作業枠
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cal-work-start">開始</Label>
                    <Input
                      id="cal-work-start"
                      type="datetime-local"
                      value={form.workStartsAt}
                      onChange={(e) =>
                        patchForm("workStartsAt", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cal-work-end">終了</Label>
                    <Input
                      id="cal-work-end"
                      type="datetime-local"
                      value={form.workEndsAt}
                      onChange={(e) => patchForm("workEndsAt", e.target.value)}
                      required
                    />
                  </div>
                </div>
                {resolvedWorkBlockId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 shrink-0 border-red-200 text-red-600 hover:border-red-500"
                    disabled={deletingBlock || saving || archiving}
                    onClick={() => void onDeleteWorkBlock()}
                  >
                    {deletingBlock ? "削除中…" : "枠を削除"}
                  </Button>
                ) : null}
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <Label htmlFor="cal-work-note">作業日誌</Label>
                <Textarea
                  id="cal-work-note"
                  value={form.workNoteMd}
                  onChange={(e) => patchForm("workNoteMd", e.target.value)}
                  rows={4}
                  placeholder="この枠でやったこと・気づき…"
                  className="min-h-[96px] text-sm"
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-task-project">Project</Label>
            <Select
              id="cal-task-project"
              value={form.projectId}
              onChange={(e) => patchForm("projectId", e.target.value)}
            >
              <option value="">（なし）</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-task-body">メモ</Label>
            <Textarea
              id="cal-task-body"
              value={form.bodyMd}
              onChange={(e) => patchForm("bodyMd", e.target.value)}
              rows={5}
            />
          </div>

          {error ? (
            <p className="m-0 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={`/admin/workspace/tasks/?task=${task?.id ?? taskId}`}>
                Tasks で開く
              </Link>
            </Button>
          </div>
        </form>
      ) : (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error || "読み込みに失敗しました"}
        </p>
      )}
    </AdminContentModal>
  );
}
