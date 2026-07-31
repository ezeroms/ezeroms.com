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
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import type {
  TaskPriority,
  TaskStatus,
  WorkspaceProject,
  WorkspaceTask,
} from "@/types/workspace";

type Props = {
  open: boolean;
  taskId: string | null;
  /** Optional seed while the latest task is loading. */
  initialTask?: WorkspaceTask | null;
  onClose: () => void;
  onSaved: (task: WorkspaceTask) => void;
  onArchived: (taskId: string) => void;
};

type FormState = {
  title: string;
  bodyMd: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  scheduledDate: string;
  scheduledAt: string;
  dueAt: string;
  estimatedMinutes: string;
  location: string;
};

function formFromTask(task: WorkspaceTask): FormState {
  return {
    title: task.title,
    bodyMd: task.body_md ?? "",
    status: task.status,
    priority: task.priority,
    projectId: task.project_id ?? "",
    scheduledDate: task.scheduled_date ?? "",
    scheduledAt: toDatetimeLocalValue(task.scheduled_at),
    dueAt: toDatetimeLocalValue(task.due_at),
    estimatedMinutes:
      task.estimated_minutes != null ? String(task.estimated_minutes) : "",
    location: task.location ?? "",
  };
}

export function TaskEditModal({
  open,
  taskId,
  initialTask = null,
  onClose,
  onSaved,
  onArchived,
}: Props) {
  const formId = useId();
  const [task, setTask] = useState<WorkspaceTask | null>(initialTask);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [form, setForm] = useState<FormState | null>(
    initialTask ? formFromTask(initialTask) : null,
  );
  const [baseline, setBaseline] = useState<FormState | null>(
    initialTask ? formFromTask(initialTask) : null,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    if (!open || !taskId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    if (initialTask && initialTask.id === taskId) {
      const seeded = formFromTask(initialTask);
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
        if (cancelled) return;
        const next = formFromTask(taskData.item);
        setTask(taskData.item);
        setForm(next);
        setBaseline(next);
        setProjects(projectsData.items ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "読み込みに失敗しました");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, taskId, initialTask]);

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
      const res = await fetch(`/api/admin/workspace/tasks/${task.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          body_md: form.bodyMd,
          status: form.status,
          priority: form.priority,
          project_id: form.projectId || null,
          scheduled_date: form.scheduledDate || null,
          scheduled_at: fromDatetimeLocalValue(form.scheduledAt),
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
      const next = formFromTask(data.item);
      setTask(data.item);
      setForm(next);
      setBaseline(next);
      onSaved(data.item);
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

  async function createProject() {
    const name = newProjectName.trim();
    if (!name || saving || archiving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/workspace/projects/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as {
        item?: WorkspaceProject;
        error?: string;
      };
      if (!res.ok || !data.item) {
        throw new Error(data.error || "Project 作成に失敗しました");
      }
      setProjects((prev) => [data.item!, ...prev]);
      patchForm("projectId", data.item.id);
      setNewProjectName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Project 作成に失敗しました",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminContentModal
      open={open}
      onClose={onClose}
      title={task?.title ? `Task: ${task.title}` : "Task"}
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
              <Label htmlFor="cal-task-priority">優先度</Label>
              <Select
                id="cal-task-priority"
                value={form.priority}
                onChange={(e) =>
                  patchForm("priority", e.target.value as TaskPriority)
                }
              >
                {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cal-task-scheduled-date">予定日</Label>
              <Input
                id="cal-task-scheduled-date"
                type="date"
                value={form.scheduledDate}
                onChange={(e) => patchForm("scheduledDate", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cal-task-scheduled-at">作業開始</Label>
              <Input
                id="cal-task-scheduled-at"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => patchForm("scheduledAt", e.target.value)}
              />
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
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="cal-task-location">場所</Label>
              <Input
                id="cal-task-location"
                value={form.location}
                onChange={(e) => patchForm("location", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-task-project">Project</Label>
            <Select
              id="cal-task-project"
              value={form.projectId}
              onChange={(e) => patchForm("projectId", e.target.value)}
            >
              <option value="">（なし）</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <div className="mt-1 flex gap-2">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="新しい Project 名"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={createProject}
                disabled={saving || archiving || !newProjectName.trim()}
              >
                作成
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-task-body">詳細</Label>
            <Textarea
              id="cal-task-body"
              value={form.bodyMd}
              onChange={(e) => patchForm("bodyMd", e.target.value)}
              className="min-h-[140px] font-mono text-sm"
              placeholder="Markdown でメモ…"
            />
          </div>

          {taskId ? (
            <p className="m-0 text-xs text-muted-foreground">
              <Link
                href={`/admin/workspace/tasks/${taskId}/`}
                className="underline-offset-2 hover:underline"
              >
                フルページで開く
              </Link>
              （リンク付き Docs など）
            </p>
          ) : null}
        </form>
      ) : (
        <p className="m-0 text-sm text-muted-foreground">
          タスクを読み込めませんでした。
        </p>
      )}
    </AdminContentModal>
  );
}
