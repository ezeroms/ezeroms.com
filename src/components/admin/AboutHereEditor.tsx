"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { OgImageField } from "@/components/admin/OgImageField";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type AboutHereEditorInitial = {
  id: string;
  title: string;
  body_md: string;
  og_image: string;
  status: "published" | "draft";
};

export function AboutHereEditor({
  initial,
}: {
  initial: AboutHereEditorInitial | null;
}) {
  const router = useRouter();

  const [baseline] = useState(() => ({
    id: initial?.id ?? "",
    title: initial?.title ?? "このサイトについて",
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
    // 既存の Notes 用アップロード API を流用（Storage は media/notes/about-here/）
    const form = new FormData();
    form.set("file", file);
    form.set("folder", "about-here");
    const res = await fetch("/api/admin/notes/media/upload/", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as {
      error?: string;
      image_url?: string;
    };
    if (!res.ok || !data.image_url) {
      setError(data.error || "画像のアップロードに失敗しました");
      return null;
    }
    setError(null);
    return data.image_url;
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
      const res = await fetch("/api/admin/about/here/", {
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
      {ok ? <Alert>Here を保存しました</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="here-title">タイトル</Label>
        <Input
          id="here-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="このサイトについて"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="here-body">本文</Label>
        <AdminRichTextEditor
          id="here-body"
          value={bodyMd}
          onChange={setBodyMd}
          disabled={loading}
          placeholder="このサイトについての本文…"
          minHeightClassName="min-h-[320px]"
          onUploadImage={uploadBodyImage}
        />
        <p className="m-0 text-xs text-muted-foreground">
          画像はツールバーまたはドラッグ＆ドロップ／ペーストで挿入できます。
        </p>
      </div>

      <OgImageField
        value={ogImage}
        onChange={setOgImage}
        uploadKind="about"
        disabled={loading}
      />

      <div className="space-y-2">
        <Label htmlFor="here-status">ステータス</Label>
        <Select
          id="here-status"
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
