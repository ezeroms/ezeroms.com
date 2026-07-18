"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OG_IMAGE_ASPECT_CLASS } from "@/lib/content/og-image";
import { cn } from "@/lib/cn";

type Props = {
  id?: string;
  value: string;
  onChange: (url: string) => void;
  /** Upload folder prefix under media/, e.g. "diary" → media/og/diary/… */
  uploadKind?: string;
  disabled?: boolean;
};

/**
 * OGP image URL + optional Storage upload.
 * Recommended size: 1200×630 (1.91:1).
 */
export function OgImageField({
  id = "og-image",
  value,
  onChange,
  uploadKind = "content",
  disabled = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
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
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>OGP 画像（1200×630）</Label>
      <Input
        id={id}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://… または下からアップロード"
        disabled={disabled || uploading}
      />
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          void onFile(file);
          e.target.value = "";
        }}
      />
      <p className="m-0 text-xs text-muted-foreground">
        {uploading
          ? "アップロード中…"
          : "推奨 1200×630（1.91:1）。一覧サムネ・SNS プレビュー兼用。"}
      </p>
      {uploadError ? (
        <p className="m-0 text-xs text-destructive">{uploadError}</p>
      ) : null}
      {value.trim() ? (
        <div
          className={cn(
            "overflow-hidden rounded-lg border border-border bg-muted",
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
      ) : null}
    </div>
  );
}
