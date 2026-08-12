"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CreateWorkBlockPanel } from "@/components/calendar/CreateWorkBlockPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLinkedItems } from "@/components/workspace/WorkspaceLinkedItems";
import {
  endOfTodayDatetimeLocalValue,
  fromDatetimeLocalValue,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import { parseEstimatedMinutesInput } from "@/lib/workspace/task-form";
import type { GoogleCalendarListItem } from "@/types/calendar";
import type {
  TaskPriority,
  TaskStatus,
  WorkspaceDoc,
  WorkspaceItemLink,
  WorkspaceProject,
  WorkspaceTask,
} from "@/types/workspace";

type Props = {
  task: WorkspaceTask;
  projects: WorkspaceProject[];
  links: WorkspaceItemLink[];
  linkedDocs: WorkspaceDoc[];
  allDocs: WorkspaceDoc[];
};

export function TaskDetailForm({
  task,
  projects,
  links,
  linkedDocs,
  allDocs,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [bodyMd, setBodyMd] = useState(task.body_md ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [projectId, setProjectId] = useState(task.project_id ?? "");
  const [scheduledDate, setScheduledDate] = useState(task.scheduled_date ?? "");
  const [dueAt, setDueAt] = useState(toDatetimeLocalValue(task.due_at));
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task.estimated_minutes != null ? String(task.estimated_minutes) : "",
  );
  const [newProjectName, setNewProjectName] = useState("");
  const [projectList, setProjectList] = useState(projects);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [writableCalendars, setWritableCalendars] = useState<
    GoogleCalendarListItem[]
  >([]);
  const [writableCalendarId, setWritableCalendarId] = useState<string | null>(
    null,
  );

  async function openSchedule() {
    setScheduleBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/workspace/calendar/calendars/");
      const data = (await res.json()) as {
        connected?: boolean;
        canWrite?: boolean;
        calendars?: GoogleCalendarListItem[];
        writableCalendarId?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Calendar 情報の取得に失敗");
      if (!data.connected) {
        throw new Error("先に Calendar で Google を接続してください");
      }
      if (!data.canWrite) {
        throw new Error(
          "書き込み権限がありません。Calendar で再接続してください",
        );
      }
      const writable = (data.calendars ?? []).filter((c) => !c.readOnly);
      if (writable.length === 0) {
        throw new Error("書き込み可能なカレンダーがありません");
      }
      setWritableCalendars(writable);
      setWritableCalendarId(data.writableCalendarId ?? null);
      setScheduleOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "開けませんでした");
    } finally {
      setScheduleBusy(false);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const minutesParsed = parseEstimatedMinutesInput(estimatedMinutes);
      if (!minutesParsed.ok) throw new Error(minutesParsed.error);
      const res = await fetch(`/api/admin/workspace/tasks/${task.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body_md: bodyMd,
          status,
          priority,
          project_id: projectId || null,
          scheduled_date: scheduledDate || null,
          due_at: fromDatetimeLocalValue(dueAt),
          estimated_minutes: minutesParsed.value,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      setMessage("保存しました");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function onArchive() {
    if (busy) return;
    if (!confirm("この Task をアーカイブしますか？")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workspace/tasks/${task.id}/`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "アーカイブに失敗しました");
      router.push("/admin/workspace/tasks/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "アーカイブに失敗しました");
      setBusy(false);
    }
  }

  async function createProject() {
    const name = newProjectName.trim();
    if (!name || busy) return;
    setBusy(true);
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
      if (!res.ok) throw new Error(data.error || "Project 作成に失敗しました");
      if (data.item) {
        setProjectList((prev) => [data.item!, ...prev]);
        setProjectId(data.item.id);
        setNewProjectName("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Project 作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {scheduleOpen ? (
        <CreateWorkBlockPanel
          task={{
            ...task,
            title: title.trim() || task.title,
            estimated_minutes: estimatedMinutes.trim()
              ? Number(estimatedMinutes) || task.estimated_minutes
              : task.estimated_minutes,
            body_md: bodyMd,
          }}
          writableCalendars={writableCalendars}
          writableCalendarId={writableCalendarId}
          onClose={() => setScheduleOpen(false)}
          onCreated={() => {
            setScheduleOpen(false);
            setMessage("Googleカレンダーに作業枠を作成しました");
            router.refresh();
          }}
        />
      ) : null}

      <form onSubmit={onSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-title">タイトル</Label>
          <Input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-status">状態</Label>
            <Select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-priority">優先度</Label>
            <Select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-scheduled">予定日</Label>
            <Input
              id="task-scheduled"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due">期限</Label>
            <div className="flex items-center gap-2">
              <Input
                id="task-due"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 shrink-0"
                onClick={() => setDueAt(endOfTodayDatetimeLocalValue())}
              >
                今日中
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-estimate">作業時間（見積・分）</Label>
            <Input
              id="task-estimate"
              type="number"
              min={1}
              inputMode="numeric"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-project">Project</Label>
          <Select
            id="task-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">（なし）</option>
            {projectList.map((p) => (
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
              disabled={busy || !newProjectName.trim()}
            >
              作成
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-body">詳細</Label>
          <Textarea
            id="task-body"
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            className="min-h-[160px] font-mono text-sm"
            placeholder="Markdown でメモ…"
          />
        </div>

        {error ? (
          <p className="m-0 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="m-0 text-sm text-emerald-700">{message}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || !title.trim()}>
            {busy ? "保存中…" : "保存"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={openSchedule}
            disabled={busy || scheduleBusy}
          >
            {scheduleBusy ? "準備中…" : "作業枠を作成"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/workspace/tasks/">一覧へ</Link>
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onArchive}
            disabled={busy}
          >
            アーカイブ
          </Button>
        </div>
      </form>

      <WorkspaceLinkedItems
        entityType="task"
        entityId={task.id}
        initialLinks={links}
        linkedDocs={linkedDocs}
        linkedTasks={[]}
        linkCandidates={{ docs: allDocs, tasks: [] }}
      />
    </div>
  );
}
