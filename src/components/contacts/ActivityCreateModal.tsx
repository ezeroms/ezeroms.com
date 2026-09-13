"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import { ContactMultiPicker } from "@/components/contacts/ContactMultiPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import { type WorkspaceContact } from "@/types/contacts";

const FORM_ID = "activity-create-form";

type Props = {
  open: boolean;
  onClose: () => void;
  contacts: WorkspaceContact[];
};

type FormState = {
  title: string;
  occurred_at: string;
  ended_at: string;
  location: string;
  tags: string;
  notes_md: string;
  contactIds: string[];
};

function emptyForm(): FormState {
  return {
    title: "",
    // 新規作成時は「いま」を開始時刻の初期値にする
    occurred_at: toDatetimeLocalValue(new Date().toISOString()),
    ended_at: "",
    location: "",
    tags: "",
    notes_md: "",
    contactIds: [],
  };
}

export function ActivityCreateModal({ open, onClose, contacts }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [baseline, setBaseline] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setError(null);
      return;
    }
    const initial = emptyForm();
    setForm(initial);
    setBaseline(initial);
  }, [open]);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(baseline),
    [form, baseline],
  );

  const selectedIds = useMemo(
    () => new Set(form.contactIds),
    [form.contactIds],
  );

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const title = form.title.trim();
    if (!title) {
      setError("タイトルは必須です");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/workspace/activities/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          occurred_at: fromDatetimeLocalValue(form.occurred_at),
          ended_at: fromDatetimeLocalValue(form.ended_at),
          location: form.location.trim() || null,
          tags: form.tags,
          notes_md: form.notes_md || null,
          contact_ids: form.contactIds,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "追加に失敗しました");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return (
    <AdminContentModal
      open={open}
      onClose={onClose}
      title="Activity を追加"
      formId={FORM_ID}
      isEdit={false}
      saving={saving}
      dirty={dirty && Boolean(form.title.trim())}
      deleteError={error}
      createLabel="追加"
      maxWidthClassName="max-w-2xl"
      maxHeightClassName="max-h-[min(90vh,44rem)]"
    >
      <form
        id={FORM_ID}
        aria-labelledby={titleId}
        onSubmit={onSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activity-create-title">アクティビティ名</Label>
          <Input
            id="activity-create-title"
            value={form.title}
            disabled={saving}
            required
            onChange={(e) => patch("title", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activity-create-start">開始</Label>
            <Input
              id="activity-create-start"
              type="datetime-local"
              value={form.occurred_at}
              disabled={saving}
              onChange={(e) => patch("occurred_at", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activity-create-end">終了</Label>
            <Input
              id="activity-create-end"
              type="datetime-local"
              value={form.ended_at}
              disabled={saving}
              onChange={(e) => patch("ended_at", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activity-create-location">場所</Label>
          <Input
            id="activity-create-location"
            value={form.location}
            disabled={saving}
            onChange={(e) => patch("location", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activity-create-tags">タグ（カンマ区切り）</Label>
          <Input
            id="activity-create-tags"
            value={form.tags}
            disabled={saving}
            placeholder="飲み, 旅行"
            onChange={(e) => patch("tags", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activity-create-notes">メモ</Label>
          <Textarea
            id="activity-create-notes"
            value={form.notes_md}
            disabled={saving}
            className="min-h-[120px]"
            placeholder="何をしたか、どんな話をしたかなど"
            onChange={(e) => patch("notes_md", e.target.value)}
          />
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 text-sm font-medium">一緒にいた人</legend>
          <ContactMultiPicker
            contacts={contacts}
            selectedIds={selectedIds}
            onChange={(next) => patch("contactIds", [...next])}
            disabled={saving}
          />
        </fieldset>
      </form>
    </AdminContentModal>
  );
}
