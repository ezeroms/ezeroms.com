"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { getPhotoGallery } from "@/lib/content/photo-galleries";

function localDatetimeValue(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type PhotoEditorInitial = {
  slug: string;
  title: string;
  date: string;
  location: string;
  camera: string;
  image_url: string;
  caption: string;
  status: "published" | "draft";
};

export function PhotoEditorForm({
  galleryId,
  initial,
}: {
  galleryId: PhotoGalleryId;
  initial?: PhotoEditorInitial;
}) {
  const g = getPhotoGallery(galleryId);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial?.slug);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(
    initial?.date ? localDatetimeValue(new Date(initial.date)) : localDatetimeValue(),
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [camera, setCamera] = useState(initial?.camera ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [status, setStatus] = useState<"published" | "draft">(
    initial?.status ?? "published",
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<{ slug: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadImage(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch(`/api/admin/photos/${galleryId}/upload/`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        error?: string;
        image_url?: string;
      };
      if (!res.ok) {
        setError(data.error || "画像のアップロードに失敗しました");
        return;
      }
      if (data.image_url) setImageUrl(data.image_url);
      if (!title.trim() && file.name) {
        setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
      }
    } catch {
      setError("アップロード中に通信エラーが発生しました");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);
    try {
      const payload = {
        title,
        date: new Date(date).toISOString(),
        location,
        camera,
        image_url: imageUrl,
        caption,
        status,
      };
      const res = await fetch(
        isEdit
          ? `/api/admin/photos/${galleryId}/${initial!.slug}/`
          : `/api/admin/photos/${galleryId}/`,
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
      const slug = data.item?.slug;
      if (!slug) {
        setError("保存結果が不正です");
        return;
      }
      setOk({ slug });
      if (!isEdit) {
        router.push(`${g.adminPath}${slug}/edit/`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setError("保存中に通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {ok ? (
        <Alert>
          保存しました。{" "}
          <Link
            href={`${g.basePath}${ok.slug}/`}
            className="underline"
            target="_blank"
          >
            公開ページを見る
          </Link>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="photo-image">写真</Label>
        {imageUrl ? (
          <div className="overflow-hidden rounded-lg border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="m-0 max-h-64 w-full object-contain"
            />
          </div>
        ) : null}
        <input
          ref={fileRef}
          id="photo-image"
          type="file"
          accept="image/*"
          className="block w-full text-sm"
          disabled={uploading || loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadImage(file);
          }}
        />
        <p className="m-0 text-xs text-muted-foreground">
          {uploading ? "アップロード中…" : "画像を選択すると Storage に保存されます"}
        </p>
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="または画像 URL を直接入力"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo-title">タイトル</Label>
        <Input
          id="photo-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="photo-date">日付</Label>
          <Input
            id="photo-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="photo-status">公開状態</Label>
          <Select
            id="photo-status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value === "draft" ? "draft" : "published")
            }
          >
            <option value="published">公開</option>
            <option value="draft">下書き</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="photo-location">場所</Label>
          <Input
            id="photo-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="任意"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="photo-camera">カメラ</Label>
          <Input
            id="photo-camera"
            value={camera}
            onChange={(e) => setCamera(e.target.value)}
            placeholder="任意"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo-caption">キャプション（Markdown 可）</Label>
        <Textarea
          id="photo-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={5}
          placeholder="短い説明があれば"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={loading || uploading}>
          {loading ? "保存中…" : isEdit ? "更新する" : "追加する"}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href={g.adminPath}>一覧へ戻る</Link>
        </Button>
      </div>
    </form>
  );
}
