"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import { Button } from "@/components/ui/button";
import {
  ClickToEditField,
  ClickToEditRow,
} from "@/components/ui/click-to-edit-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
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
  sumWorkBlockMinutes,
} from "@/lib/workspace/task-form";
import type {
  TaskStatus,
  TaskWorkBlock,
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
  body_md: string;
  status: TaskStatus;
  project_id: string;
  due_at: string;
  estimated_minutes: string;
  progress_percent: string;
  starts_at: string;
  ends_at: string;
  /** 作業枠の日誌（Markdown） */
  note_md: string;
};

type WorkSeed = {
  starts_at: string;
  ends_at: string;
  note_md?: string | null;
};

type TaskModalTab = "work" | "task";

const TABS: { id: TaskModalTab; label: string }[] = [
  { id: "work", label: "作業枠" },
  { id: "task", label: "タスク" },
];

const bareControlClass =
  "admin-input-bare h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0";

function formFromTask(
  task: WorkspaceTask,
  work?: WorkSeed | null,
): FormState {
  return {
    title: task.title,
    body_md: task.body_md ?? "",
    status: task.status,
    project_id: task.project_id ?? "",
    due_at: toDatetimeLocalValue(task.due_at),
    estimated_minutes: formatEstimatedMinutesInput(task.estimated_minutes),
    progress_percent: String(task.progress_percent ?? 0),
    starts_at: toDatetimeLocalValue(work?.starts_at ?? null),
    ends_at: toDatetimeLocalValue(work?.ends_at ?? null),
    note_md: work?.note_md ?? "",
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
  const titleId = useId();
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
  const [modalTab, setModalTab] = useState<TaskModalTab>("work");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualMinutes, setActualMinutes] = useState(0);

  async function refreshActualMinutes(forTaskId: string) {
    try {
      const res = await fetch(
        `/api/admin/workspace/work-blocks/?task_id=${encodeURIComponent(forTaskId)}`,
      );
      const data = (await res.json()) as {
        items?: TaskWorkBlock[];
      };
      if (!res.ok) return;
      setActualMinutes(sumWorkBlockMinutes(data.items ?? []));
    } catch {
      // 実績は補助表示なので失敗してもフォーム編集は続ける
    }
  }

  useEffect(() => {
    if (!open || !taskId) {
      setModalTab("work");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDeletingBlock(false);
    setResolvedWorkBlockId(workBlockId);
    setProjects([]);
    setActualMinutes(0);
    setModalTab(editingWorkBlock ? "work" : "task");
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
        // 楽観 ID など未保存の ID では API を叩かない（UUID 以外は 500 になる）
        if (
          seedWorkBlockId &&
          !seedWorkBlockId.startsWith("optimistic-") &&
          !seedWorkBlockId.startsWith("task:")
        ) {
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
        // タスクに紐づくプロジェクトがアーカイブ済みでも、選択肢に残す
        const linkedProjectId = taskData.item.project_id;
        if (
          linkedProjectId &&
          !projectItems.some((project) => project.id === linkedProjectId)
        ) {
          const projectRes = await fetch(
            `/api/admin/workspace/projects/${linkedProjectId}/`,
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
            project.status !== "archived" || project.id === linkedProjectId,
        );

        const next = formFromTask(taskData.item, work);
        setTask(taskData.item);
        setProjects(selectable);
        setResolvedWorkBlockId(blockId);
        setForm(next);
        setBaseline(next);
        void refreshActualMinutes(taskData.item.id);
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
      const minutesParsed = parseEstimatedMinutesInput(form.estimated_minutes);
      if (!minutesParsed.ok) throw new Error(minutesParsed.error);
      const progressParsed = parseProgressPercentInput(form.progress_percent);
      if (!progressParsed.ok) throw new Error(progressParsed.error);
      const minutes = minutesParsed.value;
      const progress = progressParsed.value;

      let savedBlock:
        | { id: string; starts_at: string; ends_at: string }
        | undefined;

      if (editingWorkBlock) {
        const startsAt = fromDatetimeLocalValue(form.starts_at);
        const endsAt = fromDatetimeLocalValue(form.ends_at);
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
                note_md: form.note_md.trim() || null,
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
          body_md: form.body_md,
          status: form.status,
          project_id: form.project_id || null,
          due_at: fromDatetimeLocalValue(form.due_at),
          estimated_minutes: minutes,
          progress_percent:
            form.status === "done" ? 100 : Math.round(progress),
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
              note_md: form.note_md,
            }
          : editingWorkBlock
            ? {
                starts_at: fromDatetimeLocalValue(form.starts_at)!,
                ends_at: fromDatetimeLocalValue(form.ends_at)!,
                note_md: form.note_md,
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

  const displayTitle =
    form?.title.trim() ||
    task?.title ||
    (loading ? "読み込み中…" : editingWorkBlock ? "作業枠" : "Task");

  const dueIso = form ? fromDatetimeLocalValue(form.due_at) : null;
  const dueOverdue =
    Boolean(form) &&
    dueIso != null &&
    form!.status !== "done" &&
    new Date(dueIso) < new Date();

  function renderTaskFields() {
    if (!form) return null;
    return (
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <ClickToEditField
            value={form.title}
            emptyLabel="タイトルを入力"
            required
            requiredMessage="タイトルは必須です"
            ariaLabel="タイトル"
            displayClassName="text-lg font-semibold text-foreground"
            onSave={async (next) => {
              patchForm("title", next);
            }}
          />
          <ClickToEditField
            value={form.body_md}
            inputType="textarea"
            emptyLabel="詳細を追加"
            ariaLabel="詳細"
            displayClassName="text-sm leading-relaxed text-foreground"
            onSave={async (next) => {
              patchForm("body_md", next);
            }}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            基本情報
          </h3>
          <ClickToEditRow label="状態" align="center">
            <Select
              id="cal-task-status"
              value={form.status}
              className={bareControlClass}
              onChange={(e) => {
                const nextStatus = e.target.value as TaskStatus;
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: nextStatus,
                        progress_percent:
                          nextStatus === "done"
                            ? "100"
                            : prev.progress_percent,
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
          </ClickToEditRow>

          <ClickToEditRow label="期限" align="center">
            <div className="flex items-center gap-2">
              <Input
                id="cal-task-due"
                type="datetime-local"
                value={form.due_at}
                onChange={(e) => patchForm("due_at", e.target.value)}
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
                  patchForm("due_at", endOfTodayDatetimeLocalValue())
                }
              >
                今日中
              </Button>
            </div>
          </ClickToEditRow>

          <ClickToEditRow label="進捗" align="center">
            <div className="flex items-center gap-1">
              <Input
                id="cal-task-progress"
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={form.progress_percent}
                onChange={(e) =>
                  patchForm("progress_percent", e.target.value)
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
                      Math.max(0, Number(form.progress_percent) || 0),
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
                id="cal-task-estimate"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.estimated_minutes}
                onChange={(e) =>
                  patchForm("estimated_minutes", e.target.value)
                }
                className={cn(bareControlClass, "w-12 shrink-0")}
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
              id="cal-task-project"
              value={form.project_id}
              className={bareControlClass}
              onChange={(e) => patchForm("project_id", e.target.value)}
            >
              <option value="">（なし）</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </ClickToEditRow>
        </section>

        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-red-200 px-3 text-red-600 hover:border-red-500 hover:bg-red-50 hover:text-red-700"
            disabled={archiving || saving || deletingBlock}
            onClick={() => void onArchive()}
          >
            {archiving ? "削除中…" : "タスクを削除"}
          </Button>
        </div>
      </div>
    );
  }

  function renderWorkFields() {
    if (!form) return null;
    return (
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            スケジュール
          </h3>
          <ClickToEditRow label="開始" align="center">
            <Input
              id="cal-work-start"
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => patchForm("starts_at", e.target.value)}
              required
              className={bareControlClass}
            />
          </ClickToEditRow>
          <ClickToEditRow label="終了" align="center">
            <Input
              id="cal-work-end"
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => patchForm("ends_at", e.target.value)}
              required
              className={bareControlClass}
            />
          </ClickToEditRow>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            作業日誌
          </h3>
          <ClickToEditField
            value={form.note_md}
            inputType="textarea"
            emptyLabel="日誌を追加"
            placeholder="この枠でやったこと・気づき…"
            ariaLabel="作業日誌"
            displayClassName="text-sm leading-relaxed text-foreground"
            onSave={async (next) => {
              patchForm("note_md", next);
            }}
          />
        </section>

        {resolvedWorkBlockId ? (
          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-red-200 px-3 text-red-600 hover:border-red-500 hover:bg-red-50 hover:text-red-700"
              disabled={deletingBlock || saving || archiving}
              onClick={() => void onDeleteWorkBlock()}
            >
              {deletingBlock ? "削除中…" : "作業枠を削除"}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <AdminContentModal
      open={open}
      onClose={onClose}
      title={displayTitle}
      formId={formId}
      isEdit
      saving={saving}
      dirty={dirty && Boolean(form?.title.trim())}
      deleting={archiving || deletingBlock}
      deleteError={error}
      updateLabel="保存"
      maxWidthClassName="max-w-2xl"
      maxHeightClassName="max-h-[min(90vh,48rem)]"
      header={
        editingWorkBlock ? (
          <div className="flex flex-col">
            <div className="flex flex-col gap-2 px-6 pb-4 pt-5">
              <h2
                id={titleId}
                className="m-0 text-2xl font-semibold tracking-tight text-foreground"
              >
                {displayTitle}
              </h2>
            </div>
            <div
              role="tablist"
              aria-label="作業枠とタスク"
              className="admin-underline-tabs"
            >
              {TABS.map((tab) => {
                const selected = modalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    id={`task-modal-tab-${tab.id}`}
                    onClick={() => setModalTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : undefined
      }
    >
      {loading ? (
        <p className="m-0 text-sm text-muted-foreground">読み込み中…</p>
      ) : form ? (
        <form id={formId} onSubmit={onSave} className="flex flex-col gap-6">
          {editingWorkBlock ? (
            <>
              {modalTab === "work" ? (
                <div
                  role="tabpanel"
                  aria-labelledby="task-modal-tab-work"
                >
                  {renderWorkFields()}
                </div>
              ) : (
                <div
                  role="tabpanel"
                  aria-labelledby="task-modal-tab-task"
                >
                  {renderTaskFields()}
                </div>
              )}
            </>
          ) : (
            renderTaskFields()
          )}

          {error ? (
            <p className="m-0 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error || "読み込みに失敗しました"}
        </p>
      )}
    </AdminContentModal>
  );
}
