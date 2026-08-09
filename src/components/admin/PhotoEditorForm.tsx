"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { ignorePasswordManagersProps } from "@/lib/admin/password-managers";
import {
  nowDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/workspace/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { getPhotoGallery } from "@/lib/content/photo-galleries";
import {
  filenameFromImageUrl,
  slugFromFilename,
} from "@/lib/media/photo-name";
import { cn } from "@/lib/cn";

/** 1Password / LastPass などの自動入力を抑止 */

export const PHOTO_EDITOR_FORM_ID = "photo-editor-form";

export type PhotoEditorInitial = {
  slug: string;
  filename: string;
  date: string;
  location: string;
  camera: string;
  image_url: string;
  image_thumb_url: string;
  caption: string;
  status: "published" | "draft";
};

export function PhotoEditorForm({
  galleryId,
  initial,
  formId = PHOTO_EDITOR_FORM_ID,
  hideSubmit = false,
  hideBackLink = false,
  onSaved,
  onLoadingChange,
  onDirtyChange,
}: {
  galleryId: PhotoGalleryId;
  initial?: PhotoEditorInitial;
  formId?: string;
  hideSubmit?: boolean;
  hideBackLink?: boolean;
  onSaved?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  /** 初期値から内容が変わったか（フッターの追加/更新ボタン用） */
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const gallery = getPhotoGallery(galleryId);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial?.slug);

  const [baseline] = useState(() => {
    const filename =
      initial?.filename?.trim() ||
      (initial?.image_url ? filenameFromImageUrl(initial.image_url) : "");
    return {
      filename,
      slug: initial?.slug ?? "",
      date: initial?.date
        ? toDatetimeLocalValue(initial.date)
      : nowDatetimeLocalValue(),
      location: initial?.location ?? "",
      camera: initial?.camera ?? "",
      imageUrl: initial?.image_url ?? "",
      imageThumbUrl: initial?.image_thumb_url ?? "",
      caption: initial?.caption ?? "",
      status: (initial?.status ?? "published") as "published" | "draft",
    };
  });

  const autoFromFilename = slugFromFilename(baseline.filename);

  const [filename, setFilename] = useState(baseline.filename);
  const [slug, setSlug] = useState(baseline.slug);
  // すでに slug をファイル名から外しているときだけ手動扱い
  const [slugManual, setSlugManual] = useState(
    Boolean(
      baseline.slug &&
        autoFromFilename &&
        baseline.slug !== autoFromFilename,
    ),
  );
  const [date, setDate] = useState(baseline.date);
  const [location, setLocation] = useState(baseline.location);
  const [camera, setCamera] = useState(baseline.camera);
  const [imageUrl, setImageUrl] = useState(baseline.imageUrl);
  const [imageThumbUrl, setImageThumbUrl] = useState(baseline.imageThumbUrl);
  const [caption, setCaption] = useState(baseline.caption);
  const [status, setStatus] = useState<"published" | "draft">(baseline.status);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<{ slug: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const dirty =
    filename !== baseline.filename ||
    slug !== baseline.slug ||
    date !== baseline.date ||
    location !== baseline.location ||
    camera !== baseline.camera ||
    imageUrl !== baseline.imageUrl ||
    imageThumbUrl !== baseline.imageThumbUrl ||
    caption !== baseline.caption ||
    status !== baseline.status;

  function setLoadingState(next: boolean) {
    setLoading(next);
  }

  useEffect(() => {
    onLoadingChange?.(loading || uploading);
  }, [loading, uploading, onLoadingChange]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  function applyFilename(nextFilename: string) {
    setFilename(nextFilename);
    const nextSlug = slugFromFilename(nextFilename);
    if (!nextSlug) return;
    if (!slugManual) setSlug(nextSlug);
  }

  function pickImageFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }
    void uploadImage(file);
  }

  function clearImage(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (uploading || loading) return;
    setImageUrl("");
    setImageThumbUrl("");
    setFilename("");
    if (!slugManual) setSlug("");
    if (fileRef.current) fileRef.current.value = "";
    setError(null);
  }

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
        image_thumb_url?: string;
        file_id?: string;
        path?: string;
      };
      if (!res.ok) {
        setError(data.error || "画像のアップロードに失敗しました");
        return;
      }

      if (data.image_url) setImageUrl(data.image_url);
      if (data.image_thumb_url) setImageThumbUrl(data.image_thumb_url);

      // アップロード確定名 → ファイル名 / slug（拡張子以外）
      const confirmedName =
        (data.path ? data.path.split("/").pop() : null) ||
        (data.file_id
          ? `${data.file_id}.jpg`
          : data.image_url
            ? filenameFromImageUrl(data.image_url)
            : "");
      if (confirmedName) applyFilename(confirmedName);
    } catch {
      setError("アップロード中に通信エラーが発生しました");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || loading || uploading) return;
    setError(null);
    setOk(null);
    setLoadingState(true);
    try {
      const payload = {
        slug: slug.trim(),
        filename: filename.trim(),
        date: new Date(date).toISOString(),
        location,
        camera,
        image_url: imageUrl,
        image_thumb_url: imageThumbUrl,
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
      const savedSlug = data.item?.slug;
      if (!savedSlug) {
        setError("保存結果が不正です");
        return;
      }
      setOk({ slug: savedSlug });
      router.refresh();
      if (onSaved) {
        onSaved();
      } else if (!isEdit) {
        router.push(`${gallery.adminPath}${savedSlug}/edit/`);
      }
    } catch {
      setError("保存中に通信エラーが発生しました");
    } finally {
      setLoadingState(false);
    }
  }

  const previewSrc = imageThumbUrl.trim() || imageUrl.trim();

  return (
    <form
      id={formId}
      className="flex flex-col gap-5"
      onSubmit={onSubmit}
      {...ignorePasswordManagersProps}
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {ok && !onSaved ? (
        <Alert>
          保存しました。{" "}
          <Link
            href={`${gallery.basePath}${ok.slug}/`}
            className="underline"
            target="_blank"
          >
            公開ページを見る
          </Link>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="photo-image">写真</Label>
        <input
          ref={fileRef}
          id="photo-image"
          type="file"
          accept="image/*,.heic,.heif,image/heic,image/heif"
          className="sr-only"
          disabled={uploading || loading}
          onChange={(e) => {
            pickImageFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div
          role="button"
          tabIndex={uploading || loading ? -1 : 0}
          aria-controls="photo-image"
          aria-label="写真をアップロード"
          aria-disabled={uploading || loading}
          onClick={() => {
            if (uploading || loading) return;
            fileRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (uploading || loading) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!uploading && !loading) setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!uploading && !loading) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            if (uploading || loading) return;
            pickImageFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "relative flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-solid border-border bg-card px-6 py-8 text-center shadow-none transition-colors",
            "hover:border-border-hover",
            dragOver && "border-border-hover",
            (uploading || loading) && "pointer-events-none opacity-60",
          )}
        >
          {previewSrc ? (
            <>
              <button
                type="button"
                className={cn(
                  "share-btn absolute right-2 top-2 z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-transparent",
                  "cursor-pointer text-foreground transition-[opacity,background-color]",
                  "opacity-30 hover:bg-accent hover:opacity-100",
                  "disabled:pointer-events-none disabled:opacity-20",
                )}
                aria-label="写真を削除"
                data-tooltip="削除"
                disabled={uploading || loading}
                onClick={clearImage}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt=""
                className="m-0 max-h-56 w-full object-contain"
              />
              <p className="mb-0 mt-4 text-sm text-muted-foreground">
                {uploading
                  ? "アップロード中…"
                  : "クリックまたはドロップで差し替え"}
              </p>
            </>
          ) : (
            <>
              <Upload
                className="mb-3 size-8 text-muted-foreground"
                aria-hidden
              />
              <p className="m-0 text-sm font-medium text-foreground">
                写真をドラッグ＆ドロップ
              </p>
              <p className="mb-0 mt-1 text-sm text-muted-foreground">
                またはクリックしてファイルを選択
              </p>
              {uploading ? (
                <p className="mb-0 mt-3 text-xs text-muted-foreground">
                  アップロード中（メタ削除とサムネ作成）…
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo-filename">ファイル名</Label>
        <Input
          id="photo-filename"
          value={filename}
          onChange={(e) => applyFilename(e.target.value)}
          onBlur={() => {
            const trimmed = filename.trim();
            if (trimmed) applyFilename(trimmed);
          }}
          placeholder="例: abcdefghijklmnop.jpg"
          required
          {...ignorePasswordManagersProps}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo-slug">スラッグ</Label>
        <Input
          id="photo-slug"
          value={slug}
          onChange={(e) => {
            setSlugManual(true);
            setSlug(e.target.value);
          }}
          placeholder="例: abcdefghijklmnop"
          required
          pattern="[A-Za-z0-9_-]+"
          title="半角英数字・ハイフン・アンダースコア"
          {...ignorePasswordManagersProps}
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
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="photo-status">ステータス</Label>
          <Select
            id="photo-status"
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
          <Label htmlFor="photo-location">場所</Label>
          <Input
            id="photo-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="任意"
            {...ignorePasswordManagersProps}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="photo-camera">カメラ</Label>
          <Input
            id="photo-camera"
            value={camera}
            onChange={(e) => setCamera(e.target.value)}
            placeholder="任意"
            {...ignorePasswordManagersProps}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo-memo">メモ</Label>
        <Textarea
          id="photo-memo"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={5}
          placeholder="管理用のメモ（公開ページには表示されません）"
          {...ignorePasswordManagersProps}
        />
      </div>

      {!hideSubmit || !hideBackLink ? (
        <div className="flex flex-wrap gap-2">
          {!hideSubmit ? (
            <Button type="submit" disabled={loading || uploading || !dirty}>
              {loading ? "保存中…" : isEdit ? "更新" : "追加"}
            </Button>
          ) : null}
          {!hideBackLink ? (
            <Button asChild type="button" variant="outline">
              <Link href={gallery.adminPath}>一覧へ戻る</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
