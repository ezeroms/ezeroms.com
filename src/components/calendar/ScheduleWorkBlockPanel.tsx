"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatEventTimeRange } from "@/lib/workspace/calendar/time";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import type { GoogleCalendarListItem } from "@/types/calendar";
import type { WorkspaceTask } from "@/types/workspace";

type Proposal = {
  calendarId: string;
  calendarSummary: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  taskId: string;
  taskTitle: string;
};

type Props = {
  task: WorkspaceTask;
  writableCalendars: GoogleCalendarListItem[];
  writableCalendarId: string | null;
  /** Prefilled slot, e.g. from dropping the task onto the calendar. */
  initialStart?: Date | null;
  onClose: () => void;
  onCreated: () => void;
};

function defaultStartLocal(initial?: Date | null): string {
  if (initial) return toDatetimeLocalValue(initial.toISOString());
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toDatetimeLocalValue(d.toISOString());
}

export function ScheduleWorkBlockPanel({
  task,
  writableCalendars,
  writableCalendarId,
  initialStart,
  onClose,
  onCreated,
}: Props) {
  const [calendarId, setCalendarId] = useState(
    writableCalendarId &&
      writableCalendars.some((c) => c.id === writableCalendarId)
      ? writableCalendarId
      : (writableCalendars[0]?.id ?? ""),
  );
  const [startLocal, setStartLocal] = useState(() =>
    defaultStartLocal(initialStart),
  );
  const [durationMinutes, setDurationMinutes] = useState(
    String(task.estimated_minutes && task.estimated_minutes > 0
      ? task.estimated_minutes
      : 60),
  );
  const [summary, setSummary] = useState(task.title);
  const [step, setStep] = useState<"edit" | "preview">("edit");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCal = useMemo(
    () => writableCalendars.find((c) => c.id === calendarId) ?? null,
    [writableCalendars, calendarId],
  );

  async function runPreview(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const start = fromDatetimeLocalValue(startLocal);
      if (!start) throw new Error("開始時刻が不正です");
      const mins = Number(durationMinutes);
      if (!Number.isFinite(mins) || mins <= 0) {
        throw new Error("所要時間は正の数で指定してください");
      }
      if (!calendarId) throw new Error("書き込み先カレンダーを選んでください");

      const res = await fetch("/api/admin/workspace/calendar/events/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview: true,
          taskId: task.id,
          calendarId,
          summary: summary.trim() || task.title,
          start,
          durationMinutes: mins,
        }),
      });
      const data = (await res.json()) as {
        proposal?: Proposal;
        error?: string;
        needsReconnect?: boolean;
      };
      if (!res.ok) throw new Error(data.error || "プレビューに失敗しました");
      if (!data.proposal) throw new Error("プレビュー結果が空です");
      setProposal(data.proposal);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "プレビューに失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCreate() {
    if (!proposal) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/workspace/calendar/events/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview: false,
          taskId: proposal.taskId,
          calendarId: proposal.calendarId,
          summary: proposal.summary,
          description: proposal.description,
          start: proposal.start,
          end: proposal.end,
          setScheduledDate: true,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "作成に失敗しました");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-work-block-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-md border border-border bg-card p-4 shadow-lg">
        <h2
          id="schedule-work-block-title"
          className="m-0 text-base font-semibold text-foreground"
        >
          {step === "edit" ? "作業枠を作成" : "作成内容の確認"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Task「{task.title}」を Google カレンダーに登録します。承認するまで書き込みません。
        </p>

        {error ? (
          <p className="mt-3 m-0 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {step === "edit" ? (
          <form className="mt-4 space-y-3" onSubmit={runPreview}>
            <div>
              <Label htmlFor="wb-calendar">書き込み先</Label>
              <Select
                id="wb-calendar"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                required
              >
                {writableCalendars.length === 0 ? (
                  <option value="">書き込み可能なカレンダーがありません</option>
                ) : (
                  writableCalendars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.summary}
                      {c.primary ? "（メイン）" : ""}
                    </option>
                  ))
                )}
              </Select>
            </div>
            <div>
              <Label htmlFor="wb-summary">タイトル</Label>
              <Input
                id="wb-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="wb-start">開始</Label>
              <Input
                id="wb-start"
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="wb-duration">所要時間（分）</Label>
              <Input
                id="wb-duration"
                type="number"
                min={5}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                キャンセル
              </Button>
              <Button type="submit" disabled={busy || !calendarId}>
                プレビュー
              </Button>
            </div>
          </form>
        ) : proposal ? (
          <div className="mt-4 space-y-3">
            <dl className="m-0 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">カレンダー</dt>
                <dd className="m-0 font-medium">
                  {proposal.calendarSummary || selectedCal?.summary}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">タイトル</dt>
                <dd className="m-0 font-medium">{proposal.summary}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">時間</dt>
                <dd className="m-0 font-medium tabular-nums">
                  {formatEventTimeRange(proposal.start, proposal.end, false)}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {new Date(proposal.start).toLocaleDateString("ja-JP")}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("edit")}
                disabled={busy}
              >
                戻る
              </Button>
              <Button type="button" onClick={confirmCreate} disabled={busy}>
                承認して作成
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
