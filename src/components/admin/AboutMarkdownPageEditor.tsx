"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { compressImageForUpload } from "@/lib/media/client-compress-image";
import { OgImageField } from "@/components/admin/OgImageField";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type AboutMarkdownPageInitial = {
  id: string;
  title: string;
  body_md: string;
  og_image: string;
  status: "published" | "draft";
};

type Props = {
  initial: AboutMarkdownPageInitial | null;
  /** PATCH 先（例: /api/admin/about/contact/） */
  apiPath: string;
  defaultTitle: string;
  successMessage: string;
  bodyPlaceholder: string;
  /** 本文画像アップロード先フォルダ（notes media API） */
  uploadFolder: string;
  fieldIdPrefix: string;
};

/**
 * About の Markdown 記事編集（Here / Contact 共通）。
 * タイトル・本文・OGP・公開状態を保存する。
 */
export function AboutMarkdownPageEditor({
  initial,
  apiPath,
  defaultTitle,
  successMessage,
  bodyPlaceholder,
  uploadFolder,
  fieldIdPrefix,
}: Props) {
  const router = useRouter();

  const [baseline] = useState(() => ({
    id: initial?.id ?? "",
    title: initial?.title ?? defaultTitle,
    body_md: initial?.body_md ?? "",
    og_image: initial?.og_image ?? "",
    status: (initial?.status ?? "published") as "published" | "draft",
  }));

  const [title, setTitle] = useState(baseline.title);
  const [bodyMd, setBodyMd] = useState(baseline.body_md);
  const [ogImage, setOgImage] = useState(baseline.og_image);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const dirty =
    title !== baseline.title ||
    bodyMd !== baseline.body_md ||
    ogImage !== baseline.og_image ||
    status !== baseline.status;

  async function uploadBodyImage(file: File): Promise<string | null> {
    try {
      const prepared = await compressImageForUpload(file);
      const form = new FormData();
      form.set("file", prepared);
      form.set("folder", uploadFolder);
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
    setOk(false);
    setLoading(true);
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body_md: bodyMd,
          og_image: ogImage,
          status,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "保存に失敗しました");
        return;
      }
      setOk(true);
      router.refresh();
    } catch {
      setError("保存中に通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {ok ? <Alert>{successMessage}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor={`${fieldIdPrefix}-title`}>タイトル</Label>
        <Input
          id={`${fieldIdPrefix}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder={defaultTitle}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${fieldIdPrefix}-body`}>本文</Label>
        <AdminRichTextEditor
          id={`${fieldIdPrefix}-body`}
          value={bodyMd}
          onChange={setBodyMd}
          disabled={loading}
          placeholder={bodyPlaceholder}
          minHeightClassName="min-h-[320px]"
          onUploadImage={uploadBodyImage}
        />
      </div>

      <OgImageField
        id={`${fieldIdPrefix}-og-image`}
        value={ogImage}
        onChange={setOgImage}
        uploadKind="about"
        disabled={loading}
      />

      <div className="space-y-2">
        <Label htmlFor={`${fieldIdPrefix}-status`}>ステータス</Label>
        <Select
          id={`${fieldIdPrefix}-status`}
          value={status}
          onChange={(e) =>
            setStatus(e.target.value === "draft" ? "draft" : "published")
          }
        >
          <option value="published">公開</option>
          <option value="draft">下書き</option>
        </Select>
      </div>

      <div>
        <Button type="submit" disabled={!dirty || loading}>
          {loading ? "保存中…" : "保存"}
        </Button>
      </div>
    </form>
  );
}
