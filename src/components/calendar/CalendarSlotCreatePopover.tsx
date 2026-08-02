"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import type { CalendarEventAnchor } from "@/components/calendar/CalendarEventPopover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  datetimeLocalToIso,
  isoToDatetimeLocal,
} from "@/lib/workspace/calendar/time";

export type CalendarCreateLane = "schedule" | "task";

export type CalendarSlotDraft = {
  lane: CalendarCreateLane;
  start: string;
  end: string;
  anchor: CalendarEventAnchor;
};

type Props = {
  open: boolean;
  draft: CalendarSlotDraft;
  timeZone: string;
  onClose: () => void;
  onSave: (values: {
    title: string;
    start: string;
    end: string;
  }) => Promise<void>;
};

type FormState = {
  title: string;
  start: string;
  end: string;
};

export function CalendarSlotCreatePopover({
  open,
  draft,
  timeZone,
  onClose,
  onSave,
}: Props) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const isTask = draft.lane === "task";
  const [baseline] = useState<FormState>(() => ({
    title: "",
    start: isoToDatetimeLocal(draft.start, timeZone),
    end: isoToDatetimeLocal(draft.end, timeZone),
  }));
  const [form, setForm] = useState<FormState>(baseline);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => titleRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      await onSave({
        title: form.title.trim() || (isTask ? "無題" : "(無題)"),
        start: datetimeLocalToIso(form.start, timeZone),
        end: datetimeLocalToIso(form.end, timeZone),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
      setSaving(false);
    }
  }

  return (
    <AdminContentModal
      open={open}
      onClose={onClose}
      title={isTask ? "タスクを作成" : "予定を作成"}
      formId={formId}
      isEdit={false}
      saving={saving}
      dirty
      deleteError={error}
      createLabel="作成"
      maxWidthClassName="max-w-2xl"
      maxHeightClassName="max-h-[min(90vh,36rem)]"
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cal-slot-title">
            {isTask ? "タスク名" : "タイトル"}
          </Label>
          <Input
            ref={titleRef}
            id="cal-slot-title"
            value={form.title}
            placeholder={isTask ? "タスク名" : "タイトルを追加"}
            disabled={saving}
            onChange={(e) => patchForm("title", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-slot-start">開始</Label>
            <Input
              id="cal-slot-start"
              type="datetime-local"
              value={form.start}
              disabled={saving}
              required
              onChange={(e) => patchForm("start", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cal-slot-end">終了</Label>
            <Input
              id="cal-slot-end"
              type="datetime-local"
              value={form.end}
              disabled={saving}
              required
              onChange={(e) => patchForm("end", e.target.value)}
            />
          </div>
        </div>
      </form>
    </AdminContentModal>
  );
}
