"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { OgImageField } from "@/components/admin/OgImageField";
import { compressImageForUpload } from "@/lib/media/client-compress-image";
import {
  HERE_INTRO_LABEL,
  HERE_RIGHTS_LABEL,
  HERE_UPDATES_LABEL,
} from "@/lib/content/about-here";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AdminSection } from "@/components/admin/AdminSection";

export type AboutHereEditorInitial = {
  id: string;
  title: string;
  intro_md: string;
  rights_md: string;
  updates_md: string;
  og_image: string;
  status: "published" | "draft";
};

type Props = {
  initial: AboutHereEditorInitial | null;
};

async function uploadHereImage(
  file: File,
  setError: (message: string | null) => void,
): Promise<string | null> {
  try {
    const prepared = await compressImageForUpload(file);
    const form = new FormData();
    form.set("file", prepared);
    form.set("folder", "about-here");
    const res = await fetch("/api/admin/diary/media/upload/", {
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
        /request entity too large|payload too large|body.*limit/i.test(rawText);
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

export function AboutHereEditor({ initial }: Props) {
  const router = useRouter();

  const [baseline] = useState(() => ({
    id: initial?.id ?? "",
    title: initial?.title ?? HERE_INTRO_LABEL,
    intro_md: initial?.intro_md ?? "",
    rights_md: initial?.rights_md ?? "",
    updates_md: initial?.updates_md ?? "",
    og_image: initial?.og_image ?? "",
    status: (initial?.status ?? "published") as "published" | "draft",
  }));

  const [title, setTitle] = useState(baseline.title);
  const [introMd, setIntroMd] = useState(baseline.intro_md);
  const [rightsMd, setRightsMd] = useState(baseline.rights_md);
  const [updatesMd, setUpdatesMd] = useState(baseline.updates_md);
  const [ogImage, setOgImage] = useState(baseline.og_image);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const dirty =
    title !== baseline.title ||
    introMd !== baseline.intro_md ||
    rightsMd !== baseline.rights_md ||
    updatesMd !== baseline.updates_md ||
    ogImage !== baseline.og_image ||
    status !== baseline.status;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || loading) return;
    if (!introMd.trim()) {
      setError("「このサイトについて」を入力してください");
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
          intro_md: introMd,
          rights_md: rightsMd,
          updates_md: updatesMd,
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

  const upload = (file: File) => uploadHereImage(file, setError);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {ok ? <Alert>Here を保存しました</Alert> : null}

      <AdminSection title={HERE_INTRO_LABEL}>
        <AdminRichTextEditor
          id="here-intro"
          value={introMd}
          onChange={setIntroMd}
          disabled={loading}
          placeholder="このサイトについての本文…"
          minHeightClassName="min-h-[200px]"
          onUploadImage={upload}
        />
      </AdminSection>

      <AdminSection title={HERE_RIGHTS_LABEL}>
        <AdminRichTextEditor
          id="here-rights"
          value={rightsMd}
          onChange={setRightsMd}
          disabled={loading}
          placeholder="権利表記・引用について…"
          minHeightClassName="min-h-[240px]"
          onUploadImage={upload}
        />
      </AdminSection>

      <AdminSection title={HERE_UPDATES_LABEL}>
        <AdminRichTextEditor
          id="here-updates"
          value={updatesMd}
          onChange={setUpdatesMd}
          disabled={loading}
          placeholder="LINE / Feedly / RSS など…"
          minHeightClassName="min-h-[160px]"
          onUploadImage={upload}
        />
      </AdminSection>

      <AdminSection title="公開・OGP">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="here-title">OGP タイトル</Label>
            <Input
              id="here-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={HERE_INTRO_LABEL}
            />
          </div>

          <OgImageField
            id="here-og-image"
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
        </div>
      </AdminSection>
    </form>
  );
}
