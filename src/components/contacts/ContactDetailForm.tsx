"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ActivitiesListTable } from "@/components/contacts/ActivitiesListTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  contactDisplayName,
  formatContactTags,
  type WorkspaceActivity,
  type WorkspaceContactDetail,
} from "@/types/contacts";

type Props = {
  contact: WorkspaceContactDetail;
  activities: WorkspaceActivity[];
  listHref?: string;
  /** page = standalone detail; modal = fields inside AdminContentModal */
  variant?: "page" | "modal";
  formId?: string;
  onDirtyChange?: (dirty: boolean) => void;
  onBusyChange?: (busy: boolean) => void;
  onSaved?: (contact: WorkspaceContactDetail) => void;
  onDeleted?: () => void;
};

type LabeledValue = { label: string; value: string };
type LinkRow = { label: string; url: string };
type EmploymentRow = {
  company_name: string;
  title: string;
  started_on: string;
  ended_on: string;
  is_current: boolean;
  notes: string;
};

type FormState = {
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
  is_friend: boolean;
  tags: string;
  phones: LabeledValue[];
  addresses: LabeledValue[];
  links: LinkRow[];
  employments: EmploymentRow[];
};

function fromContact(contact: WorkspaceContactDetail): FormState {
  return {
    family_name: contact.family_name ?? "",
    given_name: contact.given_name ?? "",
    middle_name: contact.middle_name ?? "",
    family_name_kana: contact.family_name_kana ?? "",
    given_name_kana: contact.given_name_kana ?? "",
    middle_name_kana: contact.middle_name_kana ?? "",
    family_name_en: contact.family_name_en ?? "",
    given_name_en: contact.given_name_en ?? "",
    middle_name_en: contact.middle_name_en ?? "",
    english_name: contact.english_name ?? "",
    nickname: contact.nickname ?? "",
    birthday: contact.birthday?.slice(0, 10) ?? "",
    birthday_year_known: contact.birthday_year_known,
    notes_md: contact.notes_md ?? "",
    is_friend: contact.is_friend,
    tags: formatContactTags(contact.tags),
    phones:
      contact.phones.length > 0
        ? contact.phones.map((p) => ({
            label: p.label ?? "",
            value: p.value,
          }))
        : [{ label: "", value: "" }],
    addresses:
      contact.addresses.length > 0
        ? contact.addresses.map((a) => ({
            label: a.label ?? "",
            value: a.value,
          }))
        : [{ label: "", value: "" }],
    links:
      contact.links.length > 0
        ? contact.links.map((l) => ({
            label: l.label ?? "",
            url: l.url,
          }))
        : [{ label: "", url: "" }],
    employments:
      contact.employments.length > 0
        ? contact.employments.map((e) => ({
            company_name: e.company_name,
            title: e.title ?? "",
            started_on: e.started_on?.slice(0, 10) ?? "",
            ended_on: e.ended_on?.slice(0, 10) ?? "",
            is_current: e.is_current,
            notes: e.notes ?? "",
          }))
        : [
            {
              company_name: "",
              title: "",
              started_on: "",
              ended_on: "",
              is_current: true,
              notes: "",
            },
          ],
  };
}

function contactHasMiddleName(contact: WorkspaceContactDetail): boolean {
  return Boolean(
    contact.middle_name?.trim() ||
      contact.middle_name_kana?.trim() ||
      contact.middle_name_en?.trim(),
  );
}

export function ContactDetailForm({
  contact,
  activities,
  listHref = "/admin/workspace/contacts/",
  variant = "page",
  formId,
  onDirtyChange,
  onBusyChange,
  onSaved,
  onDeleted,
}: Props) {
  const router = useRouter();
  const isModal = variant === "modal";
  const [form, setForm] = useState(() => fromContact(contact));
  const [baseline, setBaseline] = useState(() => fromContact(contact));
  const [showMiddleName, setShowMiddleName] = useState(() =>
    contactHasMiddleName(contact),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nameCols = showMiddleName ? "sm:grid-cols-3" : "sm:grid-cols-2";

  useEffect(() => {
    const next = fromContact(contact);
    setForm(next);
    setBaseline(next);
    setShowMiddleName(contactHasMiddleName(contact));
    setMessage(null);
    setError(null);
  }, [contact]);

  useEffect(() => {
    onDirtyChange?.(JSON.stringify(form) !== JSON.stringify(baseline));
  }, [form, baseline, onDirtyChange]);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildPayload() {
    return {
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
      is_friend: form.is_friend,
      tags: form.tags,
      phones: form.phones.filter((p) => p.value.trim()),
      addresses: form.addresses.filter((a) => a.value.trim()),
      links: form.links.filter((l) => l.url.trim()),
      employments: form.employments
        .filter((e) => e.company_name.trim())
        .map((e) => ({
          company_name: e.company_name,
          title: e.title || null,
          started_on: e.started_on || null,
          ended_on: e.ended_on || null,
          is_current: e.is_current,
          notes: e.notes || null,
        })),
    };
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/workspace/contacts/${contact.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = (await res.json()) as {
        item?: WorkspaceContactDetail;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      if (data.item) {
        const next = fromContact(data.item);
        setForm(next);
        setBaseline(next);
        onSaved?.(data.item);
      } else {
        setBaseline(form);
        onSaved?.(contact);
      }
      setMessage("保存しました");
      if (!isModal) router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (busy) return;
    if (!confirm(`${contactDisplayName(contact)} を削除しますか？`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workspace/contacts/${contact.id}/`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "削除に失敗しました");
      onDeleted?.();
      if (!isModal) {
        router.push(listHref);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setBusy(false);
    }
  }

  return (
    <div className={isModal ? "flex flex-col gap-6" : "flex flex-col gap-10"}>
      <form
        id={formId}
        onSubmit={onSave}
        className="flex flex-col gap-6"
      >
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_friend}
                disabled={busy}
                onChange={(e) => patch("is_friend", e.target.checked)}
              />
              Friend（交友録に表示）
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showMiddleName}
                disabled={busy}
                onChange={(e) => setShowMiddleName(e.target.checked)}
              />
              ミドルネームを表示
            </label>
          </div>

          <div className={`grid gap-4 ${nameCols}`}>
            <Field
              id="family_name"
              label="苗字"
              value={form.family_name}
              onChange={(v) => patch("family_name", v)}
              disabled={busy}
            />
            {showMiddleName ? (
              <Field
                id="middle_name"
                label="ミドルネーム"
                value={form.middle_name}
                onChange={(v) => patch("middle_name", v)}
                disabled={busy}
              />
            ) : null}
            <Field
              id="given_name"
              label="名前"
              value={form.given_name}
              onChange={(v) => patch("given_name", v)}
              disabled={busy}
            />
          </div>

          <div className={`grid gap-4 ${nameCols}`}>
            <Field
              id="family_name_kana"
              label="苗字（読み）"
              value={form.family_name_kana}
              onChange={(v) => patch("family_name_kana", v)}
              disabled={busy}
            />
            {showMiddleName ? (
              <Field
                id="middle_name_kana"
                label="ミドル（読み）"
                value={form.middle_name_kana}
                onChange={(v) => patch("middle_name_kana", v)}
                disabled={busy}
              />
            ) : null}
            <Field
              id="given_name_kana"
              label="名前（読み）"
              value={form.given_name_kana}
              onChange={(v) => patch("given_name_kana", v)}
              disabled={busy}
            />
          </div>

          <div className={`grid gap-4 ${nameCols}`}>
            <Field
              id="family_name_en"
              label="苗字（英語）"
              value={form.family_name_en}
              onChange={(v) => patch("family_name_en", v)}
              disabled={busy}
            />
            {showMiddleName ? (
              <Field
                id="middle_name_en"
                label="ミドル（英語）"
                value={form.middle_name_en}
                onChange={(v) => patch("middle_name_en", v)}
                disabled={busy}
              />
            ) : null}
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
            <Label htmlFor="tags">タグ（カンマ区切り）</Label>
            <Input
              id="tags"
              value={form.tags}
              disabled={busy}
              placeholder="work, networking, 名刺"
              onChange={(e) => patch("tags", e.target.value)}
            />
          </div>
        </section>

        <LabeledRowsSection
          title="電話番号"
          rows={form.phones}
          disabled={busy}
          onChange={(phones) => patch("phones", phones)}
          valuePlaceholder="090-…"
        />

        <LabeledRowsSection
          title="住所"
          rows={form.addresses}
          disabled={busy}
          onChange={(addresses) => patch("addresses", addresses)}
          valuePlaceholder="東京都…"
          valueMultiline
        />

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold">関連リンク</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() =>
                patch("links", [...form.links, { label: "", url: "" }])
              }
            >
              行を追加
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {form.links.map((row, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
                <Input
                  value={row.label}
                  disabled={busy}
                  placeholder="ラベル"
                  onChange={(e) => {
                    const next = [...form.links];
                    next[i] = { ...row, label: e.target.value };
                    patch("links", next);
                  }}
                />
                <Input
                  value={row.url}
                  disabled={busy}
                  placeholder="https://…"
                  onChange={(e) => {
                    const next = [...form.links];
                    next[i] = { ...row, url: e.target.value };
                    patch("links", next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy || form.links.length <= 1}
                  onClick={() =>
                    patch(
                      "links",
                      form.links.filter((_, j) => j !== i),
                    )
                  }
                >
                  削除
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold">会社・役職</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() =>
                patch("employments", [
                  ...form.employments,
                  {
                    company_name: "",
                    title: "",
                    started_on: "",
                    ended_on: "",
                    is_current: false,
                    notes: "",
                  },
                ])
              }
            >
              履歴を追加
            </Button>
          </div>
          <p className="m-0 text-xs text-muted-foreground">
            「現職」にチェックした行が一覧・詳細のメイン表示になります（1件のみ）。
          </p>
          <div className="flex flex-col gap-4">
            {form.employments.map((row, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-md border border-border p-3"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field
                    id={`company-${i}`}
                    label="会社名"
                    value={row.company_name}
                    onChange={(v) => {
                      const next = [...form.employments];
                      next[i] = { ...row, company_name: v };
                      patch("employments", next);
                    }}
                    disabled={busy}
                  />
                  <Field
                    id={`title-${i}`}
                    label="役職"
                    value={row.title}
                    onChange={(v) => {
                      const next = [...form.employments];
                      next[i] = { ...row, title: v };
                      patch("employments", next);
                    }}
                    disabled={busy}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`started-${i}`}>開始</Label>
                    <Input
                      id={`started-${i}`}
                      type="date"
                      value={row.started_on}
                      disabled={busy}
                      onChange={(e) => {
                        const next = [...form.employments];
                        next[i] = { ...row, started_on: e.target.value };
                        patch("employments", next);
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`ended-${i}`}>終了</Label>
                    <Input
                      id={`ended-${i}`}
                      type="date"
                      value={row.ended_on}
                      disabled={busy}
                      onChange={(e) => {
                        const next = [...form.employments];
                        next[i] = { ...row, ended_on: e.target.value };
                        patch("employments", next);
                      }}
                    />
                  </div>
                  <label className="flex items-end gap-2 pb-2 text-sm">
                    <input
                      type="radio"
                      name="current-employment"
                      checked={row.is_current}
                      disabled={busy}
                      onChange={() => {
                        patch(
                          "employments",
                          form.employments.map((e, j) => ({
                            ...e,
                            is_current: j === i,
                          })),
                        );
                      }}
                    />
                    現職（メイン表示）
                  </label>
                </div>
                <Field
                  id={`emp-notes-${i}`}
                  label="メモ"
                  value={row.notes}
                  onChange={(v) => {
                    const next = [...form.employments];
                    next[i] = { ...row, notes: v };
                    patch("employments", next);
                  }}
                  disabled={busy}
                />
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy || form.employments.length <= 1}
                    onClick={() =>
                      patch(
                        "employments",
                        form.employments.filter((_, j) => j !== i),
                      )
                    }
                  >
                    この履歴を削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

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
        {message && !isModal ? (
          <p className="m-0 text-sm text-muted-foreground">{message}</p>
        ) : null}

        {!isModal ? (
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
              <Link href={listHref}>一覧へ</Link>
            </Button>
          </div>
        ) : null}
      </form>

      {!isModal ? (
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
                  contactNames: [],
                }))}
                showContacts={false}
                emptyMessage="まだ一緒にした Activity がありません"
              />
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function LabeledRowsSection({
  title,
  rows,
  disabled,
  onChange,
  valuePlaceholder,
  valueMultiline = false,
}: {
  title: string;
  rows: LabeledValue[];
  disabled?: boolean;
  onChange: (rows: LabeledValue[]) => void;
  valuePlaceholder?: string;
  valueMultiline?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">{title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...rows, { label: "", value: "" }])}
        >
          行を追加
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className={
              valueMultiline
                ? "grid gap-2 sm:grid-cols-[8rem_1fr_auto]"
                : "grid gap-2 sm:grid-cols-[8rem_1fr_auto]"
            }
          >
            <Input
              value={row.label}
              disabled={disabled}
              placeholder="ラベル"
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, label: e.target.value };
                onChange(next);
              }}
            />
            {valueMultiline ? (
              <Textarea
                value={row.value}
                disabled={disabled}
                placeholder={valuePlaceholder}
                className="min-h-[72px]"
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...row, value: e.target.value };
                  onChange(next);
                }}
              />
            ) : (
              <Input
                value={row.value}
                disabled={disabled}
                placeholder={valuePlaceholder}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...row, value: e.target.value };
                  onChange(next);
                }}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || rows.length <= 1}
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
            >
              削除
            </Button>
          </div>
        ))}
      </div>
    </section>
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
