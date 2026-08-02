"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ActivitiesListTable } from "@/components/friends/ActivitiesListTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  friendDisplayName,
  type WorkspaceActivity,
  type WorkspaceFriend,
} from "@/types/friends";

type Props = {
  friend: WorkspaceFriend;
  activities: WorkspaceActivity[];
};

type NameForm = {
  family_name: string;
  given_name: string;
  middle_name: string;
  family_name_kana: string;
  given_name_kana: string;
  middle_name_kana: string;
  family_name_en: string;
  given_name_en: string;
  middle_name_en: string;
  english_name: string;
  nickname: string;
  birthday: string;
  birthday_year_known: boolean;
  notes_md: string;
};

function fromFriend(friend: WorkspaceFriend): NameForm {
  return {
    family_name: friend.family_name ?? "",
    given_name: friend.given_name ?? "",
    middle_name: friend.middle_name ?? "",
    family_name_kana: friend.family_name_kana ?? "",
    given_name_kana: friend.given_name_kana ?? "",
    middle_name_kana: friend.middle_name_kana ?? "",
    family_name_en: friend.family_name_en ?? "",
    given_name_en: friend.given_name_en ?? "",
    middle_name_en: friend.middle_name_en ?? "",
    english_name: friend.english_name ?? "",
    nickname: friend.nickname ?? "",
    birthday: friend.birthday?.slice(0, 10) ?? "",
    birthday_year_known: friend.birthday_year_known,
    notes_md: friend.notes_md ?? "",
  };
}

export function FriendDetailForm({ friend, activities }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(() => fromFriend(friend));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch<K extends keyof NameForm>(key: K, value: NameForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/workspace/friends/${friend.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_name: form.family_name || null,
          given_name: form.given_name || null,
          middle_name: form.middle_name || null,
          family_name_kana: form.family_name_kana || null,
          given_name_kana: form.given_name_kana || null,
          middle_name_kana: form.middle_name_kana || null,
          family_name_en: form.family_name_en || null,
          given_name_en: form.given_name_en || null,
          middle_name_en: form.middle_name_en || null,
          english_name: form.english_name || null,
          nickname: form.nickname || null,
          birthday: form.birthday || null,
          birthday_year_known: form.birthday_year_known,
          notes_md: form.notes_md || null,
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

  async function onDelete() {
    if (busy) return;
    if (!confirm(`${friendDisplayName(friend)} を削除しますか？`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workspace/friends/${friend.id}/`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "削除に失敗しました");
      router.push("/admin/workspace/friends/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={onSave} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="family_name"
            label="苗字"
            value={form.family_name}
            onChange={(v) => patch("family_name", v)}
            disabled={busy}
          />
          <Field
            id="middle_name"
            label="ミドルネーム"
            value={form.middle_name}
            onChange={(v) => patch("middle_name", v)}
            disabled={busy}
          />
          <Field
            id="given_name"
            label="名前"
            value={form.given_name}
            onChange={(v) => patch("given_name", v)}
            disabled={busy}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="family_name_kana"
            label="苗字（読み）"
            value={form.family_name_kana}
            onChange={(v) => patch("family_name_kana", v)}
            disabled={busy}
          />
          <Field
            id="middle_name_kana"
            label="ミドル（読み）"
            value={form.middle_name_kana}
            onChange={(v) => patch("middle_name_kana", v)}
            disabled={busy}
          />
          <Field
            id="given_name_kana"
            label="名前（読み）"
            value={form.given_name_kana}
            onChange={(v) => patch("given_name_kana", v)}
            disabled={busy}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="family_name_en"
            label="苗字（英語）"
            value={form.family_name_en}
            onChange={(v) => patch("family_name_en", v)}
            disabled={busy}
          />
          <Field
            id="middle_name_en"
            label="ミドル（英語）"
            value={form.middle_name_en}
            onChange={(v) => patch("middle_name_en", v)}
            disabled={busy}
          />
          <Field
            id="given_name_en"
            label="名前（英語）"
            value={form.given_name_en}
            onChange={(v) => patch("given_name_en", v)}
            disabled={busy}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="english_name"
            label="イングリッシュネーム"
            value={form.english_name}
            onChange={(v) => patch("english_name", v)}
            disabled={busy}
          />
          <Field
            id="nickname"
            label="ニックネーム"
            value={form.nickname}
            onChange={(v) => patch("nickname", v)}
            disabled={busy}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="birthday">誕生日</Label>
            <Input
              id="birthday"
              type="date"
              value={form.birthday}
              disabled={busy}
              onChange={(e) => patch("birthday", e.target.value)}
            />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.birthday_year_known}
              disabled={busy || !form.birthday}
              onChange={(e) => patch("birthday_year_known", e.target.checked)}
            />
            年も正確（オフなら月日のみとして扱う）
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes_md">メモ</Label>
          <Textarea
            id="notes_md"
            value={form.notes_md}
            disabled={busy}
            className="min-h-[120px]"
            onChange={(e) => patch("notes_md", e.target.value)}
          />
        </div>

        {error ? (
          <p className="m-0 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="m-0 text-sm text-muted-foreground">{message}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
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
            <Link href="/admin/workspace/friends/">一覧へ</Link>
          </Button>
        </div>
      </form>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="m-0 text-base font-semibold">Activities</h2>
          <Link
            href="/admin/workspace/activities/"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            すべて見る
          </Link>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="overflow-x-auto p-0">
            <ActivitiesListTable
              items={activities.map((activity) => ({
                activity,
                friendNames: [],
              }))}
              showFriends={false}
              emptyMessage="まだ一緒にした Activity がありません"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
