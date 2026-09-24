"use client";

import { compressImageForUpload } from "@/lib/media/client-compress-image";
import {
  isVideoFile,
  MAX_VIDEO_BYTES,
  videoFileMeta,
} from "@/lib/media/body-video";
import { createBrowserSupabase } from "@/lib/supabase/browser";

async function uploadImage(
  file: File,
  folder: string,
): Promise<{ url: string } | { error: string }> {
  const prepared = await compressImageForUpload(file);
  const form = new FormData();
  form.set("file", prepared);
  form.set("folder", folder);
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
    return {
      error: tooLarge
        ? "画像が大きすぎてアップロードできませんでした。もう少し小さい画像でお試しください。"
        : `画像アップロードの応答が不正です（HTTP ${res.status}）`,
    };
  }
  if (!res.ok || !data.image_url) {
    return { error: data.error || "画像のアップロードに失敗しました" };
  }
  return { url: data.image_url };
}

async function uploadVideo(
  file: File,
  folder: string,
): Promise<{ url: string } | { error: string }> {
  const meta = videoFileMeta(file);
  if (!meta) {
    return { error: "対応している動画は MP4 / WebM / MOV です" };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: "動画は 50MB までです" };
  }

  const res = await fetch("/api/admin/diary/media/sign/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder,
      extension: meta.extension,
      contentType: meta.contentType,
    }),
  });
  const signed = (await res.json()) as {
    error?: string;
    path?: string;
    token?: string;
    content_type?: string;
    video_url?: string;
  };
  if (!res.ok || !signed.path || !signed.token || !signed.video_url) {
    return { error: signed.error || "動画のアップロード準備に失敗しました" };
  }

  const sb = createBrowserSupabase();
  const uploaded = await sb.storage
    .from("media")
    .uploadToSignedUrl(signed.path, signed.token, file, {
      contentType: signed.content_type || meta.contentType,
      upsert: false,
    });
  if (uploaded.error) {
    return { error: uploaded.error.message || "動画のアップロードに失敗しました" };
  }
  return { url: signed.video_url };
}

/** Diary / Column 本文の画像・動画。 */
export async function uploadBodyMedia(
  file: File,
  folder: string,
): Promise<{ url: string } | { error: string }> {
  try {
    if (isVideoFile(file)) return await uploadVideo(file, folder);
    return await uploadImage(file, folder);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "アップロードに失敗しました",
    };
  }
}
