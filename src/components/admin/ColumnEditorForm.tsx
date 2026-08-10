"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";
import { compressImageForUpload } from "@/lib/media/client-compress-image";
import {
  nowDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import { OgImageField } from "@/components/admin/OgImageField";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { generateContentSlug } from "@/lib/admin/content";

export const COLUMN_EDITOR_FORM_ID = "column-editor-form";


export type ColumnEditorInitial = {
  slug: string;
  title: string;
  body_md: string;
  date: string;
  categories: string;
  tags: string;
  status: "published" | "draft";
  og_image: string;
};

export function ColumnEditorForm({
  initial,
  formId = COLUMN_EDITOR_FORM_ID,
  hideSubmit = false,
  onSaved,
  onLoadingChange,
  onDirtyChange,
}: {
  initial?: ColumnEditorInitial;
  formId?: string;
  hideSubmit?: boolean;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.slug);

  const [mediaFolder] = useState(
    () => initial?.slug || `draft-${generateContentSlug(12)}`,
  );

  const [baseline] = useState(() => ({
    title: initial?.title ?? "",
    bodyMd: initial?.body_md ?? "",
    date: initial?.date
      ? toDatetimeLocalValue(initial.date)
      : nowDatetimeLocalValue(),
    categories: initial?.categories ?? "",
    tags: initial?.tags ?? "",
    ogImage: initial?.og_image ?? "",
    status: (initial?.status ?? "published") as "published" | "draft",
  }));

  const [title, setTitle] = useState(baseline.title);
  const [bodyMd, setBodyMd] = useState(baseline.bodyMd);
  const [date, setDate] = useState(baseline.date);
  const [categories, setCategories] = useState(baseline.categories);
  const [tags, setTags] = useState(baseline.tags);
  const [ogImage, setOgImage] = useState(baseline.ogImage);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dirty =
    title !== baseline.title ||
    bodyMd !== baseline.bodyMd ||
    date !== baseline.date ||
    categories !== baseline.categories ||
    tags !== baseline.tags ||
    ogImage !== baseline.ogImage ||
    status !== baseline.status;

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  async function uploadBodyImage(file: File): Promise<string | null> {
    try {
      const prepared = await compressImageForUpload(file);
      const form = new FormData();
      form.set("file", prepared);
      form.set("folder", mediaFolder);
      const res = await fetch("/api/admin/notes/media/upload/", {
        method: "POST",
        body: form,
      });
      const rawText = await res.text();
      let data: { error?: string; image_url?: string } = {};
      try {
        data = JSON.parse(rawText) as typeof data;
      } catch {
        const tooLarge =
          res.status === 413 ||
          /request entity too large|payload too large|body.*limit/i.test(
            rawText,
          );
        setError(
          tooLarge
            ? "画像が大きすぎてアップロードできませんでした。もう少し小さい画像でお試しください。"
            : `画像アップロードの応答が不正です（HTTP ${res.status}）`,
        );
        return null;
      }
      if (!res.ok || !data.image_url) {
        setError(data.error || "画像のアップロードに失敗しました");
        return null;
      }
      setError(null);
      return data.image_url;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "画像のアップロードに失敗しました",
      );
      return null;
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || loading) return;
    if (!bodyMd.trim()) {
      setError("本文を入力してください");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = {
        title,
        body_md: bodyMd,
        date: new Date(date).toISOString(),
        categories,
        tags,
        og_image: ogImage,
        status,
      };
      const res = await fetch(
        isEdit ? `/api/admin/column/${initial!.slug}/` : "/api/admin/column/",
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
        <Label htmlFor="column-title">タイトル</Label>
        <Input
          id="column-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="記事タイトル"
          required
          {...ignorePasswordManagersProps}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="column-body">本文</Label>
        <AdminRichTextEditor
          id="column-body"
          value={bodyMd}
          onChange={setBodyMd}
          disabled={loading}
          placeholder="本文を書く…"
          minHeightClassName="min-h-[280px]"
          onUploadImage={uploadBodyImage}
        />
      </div>

      <OgImageField
        value={ogImage}
        onChange={setOgImage}
        uploadKind="column"
        disabled={loading}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="column-date">日時</Label>
          <Input
            id="column-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="column-status">ステータス</Label>
          <Select
            id="column-status"
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
          <Label htmlFor="column-categories">カテゴリ（カンマ区切り）</Label>
          <Input
            id="column-categories"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="エッセイ, 技術"
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="column-tags">タグ（カンマ区切り）</Label>
          <Input
            id="column-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="思考, 日常"
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
