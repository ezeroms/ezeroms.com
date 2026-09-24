import { NextRequest, NextResponse } from "next/server";
import { generateContentSlug } from "@/lib/admin/content";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const maxDuration = 30;

const FOLDER_RE = /^[a-z0-9_-]{1,64}$/i;
const EXTENSIONS = new Set(["mp4", "webm", "mov"]);
const CONTENT_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

/**
 * 本文動画の署名付きアップロード。
 * Vercel のリクエスト上限を超えるため、ファイル本体はブラウザから Storage へ直接送る。
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      folder?: string;
      extension?: string;
      contentType?: string;
    };
    const folder = String(body.folder ?? "draft").trim() || "draft";
    const extension = String(body.extension ?? "").toLowerCase();
    const contentType = String(body.contentType ?? "").toLowerCase();

    if (!FOLDER_RE.test(folder)) {
      return NextResponse.json({ error: "folder is invalid" }, { status: 400 });
    }
    if (!EXTENSIONS.has(extension) || !CONTENT_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "対応している動画は MP4 / WebM / MOV です" },
        { status: 400 },
      );
    }

    const sb = getSupabaseAdmin();
    const fileId = generateContentSlug(16);
    const path = `diary/${folder}/${fileId}.${extension}`;
    const signed = await sb.storage.from("media").createSignedUploadUrl(path);
    if (signed.error || !signed.data) {
      return NextResponse.json(
        { error: signed.error?.message || "署名付きURLを作れませんでした" },
        { status: 500 },
      );
    }

    const publicUrl = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
    return NextResponse.json({
      path: signed.data.path,
      token: signed.data.token,
      content_type: contentType,
      video_url: publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
