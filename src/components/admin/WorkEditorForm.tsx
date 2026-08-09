"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OgImageField } from "@/components/admin/OgImageField";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";
import {
  dateOnlyValue,
  nowDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const WORK_EDITOR_FORM_ID = "work-editor-form";


export type WorkEditorInitial = {
  slug: string;
  title: string;
  body_md: string;
  date: string;
  image_url: string;
  start_date: string;
  end_date: string;
  categories: string;
  tags: string;
  role: string;
  client: string;
  agency: string;
  og_image: string;
  status: "published" | "draft";
  /** Chooning などプロダクト紐付け */
  product_key?: string | null;
};

export function WorkEditorForm({
  initial,
  formId = WORK_EDITOR_FORM_ID,
  hideSubmit = false,
  productKey,
  onSaved,
  onLoadingChange,
  onDirtyChange,
}: {
  initial?: WorkEditorInitial;
  formId?: string;
  hideSubmit?: boolean;
  /** 新規作成時に付与する product_key（例: chooning） */
  productKey?: string | null;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.slug);

  const [baseline] = useState(() => ({
    title: initial?.title ?? "",
    bodyMd: initial?.body_md ?? "",
    date: initial?.date
      ? toDatetimeLocalValue(initial.date)
      : nowDatetimeLocalValue(),
    imageUrl: initial?.image_url ?? "",
    startDate: dateOnlyValue(initial?.start_date),
    endDate: dateOnlyValue(initial?.end_date),
    categories: initial?.categories ?? "",
    tags: initial?.tags ?? "",
    role: initial?.role ?? "",
    client: initial?.client ?? "",
    agency: initial?.agency ?? "",
    ogImage: initial?.og_image ?? "",
    status: (initial?.status ?? "published") as "published" | "draft",
  }));

  const [title, setTitle] = useState(baseline.title);
  const [bodyMd, setBodyMd] = useState(baseline.bodyMd);
  const [date, setDate] = useState(baseline.date);
  const [imageUrl, setImageUrl] = useState(baseline.imageUrl);
  const [startDate, setStartDate] = useState(baseline.startDate);
  const [endDate, setEndDate] = useState(baseline.endDate);
  const [categories, setCategories] = useState(baseline.categories);
  const [tags, setTags] = useState(baseline.tags);
  const [role, setRole] = useState(baseline.role);
  const [client, setClient] = useState(baseline.client);
  const [agency, setAgency] = useState(baseline.agency);
  const [ogImage, setOgImage] = useState(baseline.ogImage);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dirty =
    title !== baseline.title ||
    bodyMd !== baseline.bodyMd ||
    date !== baseline.date ||
    imageUrl !== baseline.imageUrl ||
    startDate !== baseline.startDate ||
    endDate !== baseline.endDate ||
    categories !== baseline.categories ||
    tags !== baseline.tags ||
    role !== baseline.role ||
    client !== baseline.client ||
    agency !== baseline.agency ||
    ogImage !== baseline.ogImage ||
    status !== baseline.status;

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || loading) return;
    setError(null);
    setLoading(true);
    try {
      const resolvedProductKey =
        productKey ?? initial?.product_key ?? null;
      const payload = {
        title,
        body_md: bodyMd,
        date: new Date(date).toISOString(),
        image_url: imageUrl,
        start_date: startDate || null,
        end_date: endDate || null,
        categories,
        tags,
        role,
        client,
        agency,
        og_image: ogImage,
        status,
        product_key: resolvedProductKey,
      };
      const res = await fetch(
        isEdit ? `/api/admin/work/${initial!.slug}/` : "/api/admin/work/",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as {
        error?: string;
        item?: { slug: string };
      };
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      router.refresh();
      onSaved?.();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id={formId}
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
      {...ignorePasswordManagersProps}
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="work-title">タイトル</Label>
        <Input
          id="work-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="作品タイトル"
          required
          {...ignorePasswordManagersProps}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="work-body">本文（Markdown）</Label>
        <Textarea
          id="work-body"
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          placeholder="プロジェクトの概要・担当内容…"
          rows={8}
          {...ignorePasswordManagersProps}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="work-image-url">画像 URL</Label>
        <Input
          id="work-image-url"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          {...ignorePasswordManagersProps}
        />
      </div>

      <OgImageField
        value={ogImage}
        onChange={setOgImage}
        uploadKind="work"
        disabled={loading}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="work-date">日時</Label>
          <Input
            id="work-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="work-status">ステータス</Label>
          <Select
            id="work-status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value === "draft" ? "draft" : "published")
            }
            {...ignorePasswordManagersProps}
          >
            <option value="published">公開</option>
            <option value="draft">非公開</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="work-start-date">開始日</Label>
          <Input
            id="work-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="work-end-date">終了日</Label>
          <Input
            id="work-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            {...ignorePasswordManagersProps}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="work-categories">カテゴリ（カンマ区切り）</Label>
          <Input
            id="work-categories"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="Web, Branding"
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="work-tags">タグ（カンマ区切り）</Label>
          <Input
            id="work-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="React, Design"
            {...ignorePasswordManagersProps}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="work-role">役割</Label>
          <Input
            id="work-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Designer"
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="work-client">クライアント</Label>
          <Input
            id="work-client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="work-agency">代理店</Label>
          <Input
            id="work-agency"
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            {...ignorePasswordManagersProps}
          />
        </div>
      </div>

      {!hideSubmit ? (
        <button type="submit" className="sr-only">
          保存
        </button>
      ) : null}
    </form>
  );
}
