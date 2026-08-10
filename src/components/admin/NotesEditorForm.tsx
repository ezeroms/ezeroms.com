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

function draftMediaFolderId(length = 12) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return `draft-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

export const NOTES_EDITOR_FORM_ID = "notes-editor-form";


export type NotesEditorInitial = {
  slug: string;
  body_md: string;
  date: string;
  tags: string;
  place: string;
  status: "published" | "draft";
  og_image: string;
};

export function NotesEditorForm({
  initial,
  formId = NOTES_EDITOR_FORM_ID,
  hideSubmit = false,
  onSaved,
  onLoadingChange,
  onDirtyChange,
}: {
  initial?: NotesEditorInitial;
  formId?: string;
  hideSubmit?: boolean;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.slug);

  const [mediaFolder] = useState(
    () => initial?.slug || draftMediaFolderId(),
  );

  const [baseline] = useState(() => ({
    bodyMd: initial?.body_md ?? "",
    date: initial?.date
      ? toDatetimeLocalValue(initial.date)
      : nowDatetimeLocalValue(),
    tags: initial?.tags ?? "",
    place: initial?.place ?? "",
    ogImage: initial?.og_image ?? "",
    status: (initial?.status ?? "published") as "published" | "draft",
  }));

  const [bodyMd, setBodyMd] = useState(baseline.bodyMd);
  const [date, setDate] = useState(baseline.date);
  const [tags, setTags] = useState(baseline.tags);
  const [place, setPlace] = useState(baseline.place);
  const [ogImage, setOgImage] = useState(baseline.ogImage);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dirty =
    bodyMd !== baseline.bodyMd ||
    date !== baseline.date ||
    tags !== baseline.tags ||
    place !== baseline.place ||
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
      let data: { error?: string; image_url?: string; path?: string } = {};
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
        body_md: bodyMd,
        date: new Date(date).toISOString(),
        tags,
        place,
        og_image: ogImage,
        status,
      };
      const url = isEdit
        ? `/api/admin/notes/${initial!.slug}/`
        : "/api/admin/notes/";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
        <Label htmlFor="note-body">本文</Label>
        <AdminRichTextEditor
          id="note-body"
          value={bodyMd}
          onChange={setBodyMd}
          disabled={loading}
          placeholder="今日あったこと、考えたこと…"
          minHeightClassName="min-h-[240px]"
          onUploadImage={uploadBodyImage}
        />
      </div>

      <OgImageField
        value={ogImage}
        onChange={setOgImage}
        uploadKind="diary"
        disabled={loading}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="note-date">日時</Label>
          <Input
            id="note-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note-status">ステータス</Label>
          <Select
            id="note-status"
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
          <Label htmlFor="note-tags">タグ（カンマ区切り）</Label>
          <Input
            id="note-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="散歩, 音楽"
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note-place">場所</Label>
          <Input
            id="note-place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="高円寺"
            {...ignorePasswordManagersProps}
          />
        </div>
      </div>

      {!hideSubmit ? (
        <div className="pt-1">
          <button
            type="submit"
            disabled={loading || !dirty}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-solid border-border bg-card px-4 text-sm font-medium text-foreground shadow-none hover:border-border-hover disabled:cursor-default disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "保存中…" : isEdit ? "更新" : "追加"}
          </button>
        </div>
      ) : null}
    </form>
  );
}
