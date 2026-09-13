"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ContactMultiPicker } from "@/components/contacts/ContactMultiPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import {
  formatActivityTags,
  type WorkspaceActivity,
  type WorkspaceContact,
} from "@/types/contacts";

type Props = {
  activity: WorkspaceActivity;
  contacts: WorkspaceContact[];
  allContacts: WorkspaceContact[];
};

/** 作成モーダルと同じ API 形の編集状態 */
type FormState = {
  title: string;
  occurred_at: string;
  ended_at: string;
  location: string;
  tags: string;
  notes_md: string;
};

function formFromActivity(activity: WorkspaceActivity): FormState {
  return {
    title: activity.title,
    occurred_at: toDatetimeLocalValue(activity.occurred_at),
    ended_at: toDatetimeLocalValue(activity.ended_at),
    location: activity.location ?? "",
    tags: formatActivityTags(activity.tags),
    notes_md: activity.notes_md ?? "",
  };
}

export function ActivityDetailForm({
  activity,
  contacts: initialContacts,
  allContacts,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState(() => formFromActivity(activity));
  const [contactIds, setContactIds] = useState(
    () => new Set(initialContacts.filter((c) => !c.deleted_at).map((c) => c.id)),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contactOptions = useMemo(
    () => allContacts.filter((contact) => !contact.deleted_at),
    [allContacts],
  );

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/workspace/activities/${activity.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            occurred_at: fromDatetimeLocalValue(form.occurred_at),
            ended_at: fromDatetimeLocalValue(form.ended_at),
            notes_md: form.notes_md,
            location: form.location.trim() || null,
            tags: form.tags,
          }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");

      const contactsRes = await fetch(
        `/api/admin/workspace/activities/${activity.id}/contacts/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact_ids: [...contactIds] }),
        },
      );
      const contactsData = (await contactsRes.json()) as { error?: string };
      if (!contactsRes.ok) {
        throw new Error(contactsData.error || "コンタクトの保存に失敗しました");
      }

      setMessage("保存しました");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (busy) return;
    if (!confirm(`「${activity.title}」を削除しますか？`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/workspace/activities/${activity.id}/`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "削除に失敗しました");
      router.push("/admin/workspace/activities/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-title">タイトル</Label>
        <Input
          id="activity-title"
          value={form.title}
          disabled={busy}
          required
          onChange={(e) => patchForm("title", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activity-start">開始</Label>
          <Input
            id="activity-start"
            type="datetime-local"
            value={form.occurred_at}
            disabled={busy}
            onChange={(e) => patchForm("occurred_at", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activity-end">終了</Label>
          <Input
            id="activity-end"
            type="datetime-local"
            value={form.ended_at}
            disabled={busy}
            onChange={(e) => patchForm("ended_at", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-location">場所</Label>
        <Input
          id="activity-location"
          value={form.location}
          disabled={busy}
          onChange={(e) => patchForm("location", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-tags">タグ（カンマ区切り）</Label>
        <Input
          id="activity-tags"
          value={form.tags}
          disabled={busy}
          placeholder="飲み, 旅行"
          onChange={(e) => patchForm("tags", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="activity-notes">メモ</Label>
        <Textarea
          id="activity-notes"
          value={form.notes_md}
          disabled={busy}
          className="min-h-[160px]"
          placeholder="何をしたか、どんな話をしたかなど"
          onChange={(e) => patchForm("notes_md", e.target.value)}
        />
      </div>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 text-sm font-medium">一緒にいた人</legend>
        <ContactMultiPicker
          contacts={contactOptions}
          selectedIds={contactIds}
          onChange={setContactIds}
          disabled={busy}
        />
      </fieldset>

      {error ? (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="m-0 text-sm text-muted-foreground">{message}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || !form.title.trim()}>
          保存
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={busy}
          onClick={() => void onDelete()}
        >
          削除
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/admin/workspace/activities/">一覧へ</Link>
        </Button>
      </div>
    </form>
  );
}
