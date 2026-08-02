"use client";

import {
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { OG_IMAGE_ASPECT_CLASS } from "@/lib/content/og-image";
import { cn } from "@/lib/cn";

type Props = {
  id?: string;
  value: string;
  onChange: (url: string) => void;
  /** Upload folder prefix under media/og/, e.g. "diary" */
  uploadKind?: string;
  disabled?: boolean;
};

/**
 * OGP image — Photos と同じドラッグ＆ドロップ + メタ削除アップロード。
 * 推奨サイズ: 1200×630（1.91:1）。
 */
export function OgImageField({
  id = "og-image",
  value,
  onChange,
  uploadKind = "content",
  disabled = false,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const busy = disabled || uploading;

  function pickImageFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("画像ファイルを選択してください");
      return;
    }
    void uploadImage(file);
  }

  function clearImage(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
    setUploadError(null);
  }

  async function uploadImage(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", uploadKind);
      const res = await fetch("/api/admin/media/og/upload/", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as {
        error?: string;
        image_url?: string;
      };
      if (!res.ok || !data.image_url) {
        setUploadError(data.error || "アップロードに失敗しました");
        return;
      }
      onChange(data.image_url);
    } catch {
      setUploadError("通信エラーが発生しました");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>OGP 画像（1200×630）</Label>
      <input
        ref={fileRef}
        id={id}
        type="file"
        accept="image/*,.heic,.heif,image/heic,image/heif"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          pickImageFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-controls={id}
        aria-label="OGP 画像をアップロード"
        aria-disabled={busy}
        onClick={() => {
          if (busy) return;
          fileRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (busy) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!busy) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!busy) setDragOver(true);
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
          if (busy) return;
          pickImageFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-solid border-border bg-card px-6 py-8 text-center shadow-none transition-colors",
          "hover:border-border-hover",
          dragOver && "border-border-hover",
          busy && "pointer-events-none opacity-60",
          value.trim() ? "min-h-0 p-0" : "min-h-48",
        )}
      >
        {value.trim() ? (
          <>
            <button
              type="button"
              className={cn(
                "share-btn absolute right-2 top-2 z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-transparent",
                "cursor-pointer text-foreground transition-[opacity,background-color]",
                "opacity-30 hover:bg-accent hover:opacity-100",
                "disabled:pointer-events-none disabled:opacity-20",
              )}
              aria-label="OGP 画像を削除"
              data-tooltip="削除"
              disabled={busy}
              onClick={clearImage}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            <div
              className={cn(
                "w-full overflow-hidden rounded-md bg-muted",
                OG_IMAGE_ASPECT_CLASS,
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt=""
                className="m-0 block h-full w-full object-cover"
              />
            </div>
            <p className="mb-0 px-4 py-3 text-sm text-muted-foreground">
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
              OGP 画像をドラッグ＆ドロップ
            </p>
            <p className="mb-0 mt-1 text-sm text-muted-foreground">
              またはクリックしてファイルを選択
            </p>
            <p className="mb-0 mt-2 text-xs text-muted-foreground">
              推奨 1200×630（1.91:1）。メタデータは自動削除されます。
            </p>
            {uploading ? (
              <p className="mb-0 mt-3 text-xs text-muted-foreground">
                アップロード中（メタ削除）…
              </p>
            ) : null}
          </>
        )}
      </div>
      {uploadError ? (
        <p className="m-0 text-xs text-destructive" role="alert">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}
