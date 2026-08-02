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
};

type FormState = {
  title: string;
  bodyMd: string;
  status: TaskStatus;
  projectId: string;
  dueAt: string;
  estimatedMinutes: string;
  location: string;
  workStartsAt: string;
  workEndsAt: string;
};

function formFromTask(
  task: WorkspaceTask,
  work?: { starts_at: string; ends_at: string } | null,
): FormState {
  return {
    title: task.title,
    bodyMd: task.body_md ?? "",
    status: task.status,
    projectId: task.project_id ?? "",
    dueAt: toDatetimeLocalValue(task.due_at),
    estimatedMinutes:
      task.estimated_minutes != null ? String(task.estimated_minutes) : "",
    location: task.location ?? "",
    workStartsAt: toDatetimeLocalValue(work?.starts_at ?? null),
    workEndsAt: toDatetimeLocalValue(work?.ends_at ?? null),
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !taskId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setResolvedWorkBlockId(workBlockId);

    if (initialTask && initialTask.id === taskId) {
      const seeded = formFromTask(initialTask, initialWorkBlock);
      setTask(initialTask);
      setForm(seeded);
      setBaseline(seeded);
    }

    void (async () => {
      try {
        const [taskRes, projectsRes] = await Promise.all([
          fetch(`/api/admin/workspace/tasks/${taskId}/`),
          fetch("/api/admin/workspace/projects/"),
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

        let work = initialWorkBlock;
        let blockId = workBlockId;
        if (workBlockId) {
          const blockRes = await fetch(
            `/api/admin/workspace/work-blocks/${workBlockId}/`,
          );
          const blockData = (await blockRes.json()) as {
            item?: { id: string; starts_at: string; ends_at: string };
            error?: string;
          };
          if (blockRes.ok && blockData.item) {
            work = {
              starts_at: blockData.item.starts_at,
              ends_at: blockData.item.ends_at,
            };
            blockId = blockData.item.id;
          }
        }

        if (cancelled) return;
        const next = formFromTask(taskData.item, work);
        setTask(taskData.item);
        setProjects(projectsData.items ?? []);
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
  }, [open, taskId, workBlockId, initialTask, initialWorkBlock]);

  const dirty = useMemo(() => {
    if (!form || !baseline) return false;
    return JSON.stringify(form) !== JSON.stringify(baseline);
  }, [form, baseline]);

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!task || !form || saving || archiving) return;
    setSaving(true);
    setError(null);
    try {
      const minutes = form.estimatedMinutes.trim()
        ? Number(form.estimatedMinutes)
        : null;
      if (minutes != null && (!Number.isFinite(minutes) || minutes <= 0)) {
        throw new Error("見積もりは正の整数で入力してください");
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
              }),
            },
          );
          const blockData = (await blockRes.json()) as {
            item?: { id: string; starts_at: string; ends_at: string };
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
        savedBlock ??
          (editingWorkBlock
            ? {
                starts_at: fromDatetimeLocalValue(form.workStartsAt)!,
                ends_at: fromDatetimeLocalValue(form.workEndsAt)!,
              }
            : null),
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
    if (!task || saving || archiving) return;
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
      {loading && !form ? (
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
                onChange={(e) =>
                  patchForm("status", e.target.value as TaskStatus)
                }
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
              <Input
                id="cal-task-due"
                type="datetime-local"
                value={form.dueAt}
                onChange={(e) => patchForm("dueAt", e.target.value)}
              />
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
            <div className="flex flex-col gap-1.5">
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cal-work-start">開始</Label>
                  <Input
                    id="cal-work-start"
                    type="datetime-local"
                    value={form.workStartsAt}
                    onChange={(e) => patchForm("workStartsAt", e.target.value)}
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
