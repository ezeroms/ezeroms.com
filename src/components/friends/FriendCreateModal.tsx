"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminContentModal } from "@/components/admin/AdminContentModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendHasIdentity } from "@/types/friends";

const FORM_ID = "friend-create-form";

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  family_name: string;
  given_name: string;
  middle_name: string;
  family_name_kana: string;
  given_name_kana: string;
  middle_name_kana: string;
  english_name: string;
  nickname: string;
  birthday: string;
  birthday_year_known: boolean;
};

const EMPTY: FormState = {
  family_name: "",
  given_name: "",
  middle_name: "",
  family_name_kana: "",
  given_name_kana: "",
  middle_name_kana: "",
  english_name: "",
  nickname: "",
  birthday: "",
  birthday_year_known: false,
};

export function FriendCreateModal({ open, onClose }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      setSaving(false);
      setError(null);
    }
  }, [open]);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(EMPTY),
    [form],
  );

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (
      !friendHasIdentity({
        family_name: form.family_name || null,
        given_name: form.given_name || null,
        english_name: form.english_name || null,
        nickname: form.nickname || null,
      })
    ) {
      setError(
        "苗字・名前・イングリッシュネーム・ニックネームのいずれかは必須です",
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/workspace/friends/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_name: form.family_name || null,
          given_name: form.given_name || null,
          middle_name: form.middle_name || null,
          family_name_kana: form.family_name_kana || null,
          given_name_kana: form.given_name_kana || null,
          middle_name_kana: form.middle_name_kana || null,
          english_name: form.english_name || null,
          nickname: form.nickname || null,
          birthday: form.birthday || null,
          birthday_year_known: form.birthday_year_known,
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
      title="友達を追加"
      formId={FORM_ID}
      isEdit={false}
      saving={saving}
      dirty={dirty}
      deleteError={error}
      createLabel="追加"
      maxWidthClassName="max-w-2xl"
    >
      <form
        id={FORM_ID}
        aria-labelledby={titleId}
        onSubmit={onSubmit}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="create-family"
            label="苗字"
            value={form.family_name}
            onChange={(v) => patch("family_name", v)}
            disabled={saving}
          />
          <Field
            id="create-middle"
            label="ミドルネーム"
            value={form.middle_name}
            onChange={(v) => patch("middle_name", v)}
            disabled={saving}
          />
          <Field
            id="create-given"
            label="名前"
            value={form.given_name}
            onChange={(v) => patch("given_name", v)}
            disabled={saving}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="create-family-kana"
            label="苗字（読み）"
            value={form.family_name_kana}
            onChange={(v) => patch("family_name_kana", v)}
            disabled={saving}
            placeholder="やまだ"
          />
          <Field
            id="create-middle-kana"
            label="ミドル（読み）"
            value={form.middle_name_kana}
            onChange={(v) => patch("middle_name_kana", v)}
            disabled={saving}
          />
          <Field
            id="create-given-kana"
            label="名前（読み）"
            value={form.given_name_kana}
            onChange={(v) => patch("given_name_kana", v)}
            disabled={saving}
            placeholder="たろう"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="create-english"
            label="イングリッシュネーム"
            value={form.english_name}
            onChange={(v) => patch("english_name", v)}
            disabled={saving}
          />
          <Field
            id="create-nickname"
            label="ニックネーム"
            value={form.nickname}
            onChange={(v) => patch("nickname", v)}
            disabled={saving}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-birthday">誕生日</Label>
            <Input
              id="create-birthday"
              type="date"
              value={form.birthday}
              disabled={saving}
              onChange={(e) => patch("birthday", e.target.value)}
            />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.birthday_year_known}
              disabled={saving || !form.birthday}
              onChange={(e) => patch("birthday_year_known", e.target.checked)}
            />
            年も正確
          </label>
        </div>
      </form>
    </AdminContentModal>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
