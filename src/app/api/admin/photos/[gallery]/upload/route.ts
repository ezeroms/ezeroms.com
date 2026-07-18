import { NextRequest, NextResponse } from "next/server";
import { isPhotoGalleryId } from "@/lib/content/photo-galleries";
import { createCleanPhotoAssets } from "@/lib/media/photo-clean";
import { allocateUniquePhotoFileId } from "@/lib/media/photo-filename";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ gallery: string }> };

/**
 * 写真アップロード:
 * 1. 向きを焼き込み、メタデータを削除した JPEG + サムネを作る
 * 2. 英数字 16 桁のユニーク名で Storage へ保存
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { gallery } = await params;
  if (!isPhotoGalleryId(gallery)) {
    return NextResponse.json({ error: "Unknown gallery" }, { status: 404 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const sourceBuffer = Buffer.from(await file.arrayBuffer());
    const assets = await createCleanPhotoAssets(sourceBuffer);

    const sb = getSupabaseAdmin();

    // list と upload の間の極稀な衝突に備え、最大 2 回試す
    for (let attempt = 0; attempt < 2; attempt++) {
      const fileId = await allocateUniquePhotoFileId(sb, gallery);
      const originalPath = `photos/${gallery}/${fileId}${assets.original.extension}`;
      const thumbPath = `photos/${gallery}/${fileId}-thumb.webp`;

      const { error: originalError } = await sb.storage
        .from("media")
        .upload(originalPath, assets.original.buffer, {
          contentType: assets.original.contentType,
          upsert: false,
        });

      if (originalError) {
        // 名前衝突とみなして付け直し
        continue;
      }

      const { error: thumbError } = await sb.storage
        .from("media")
        .upload(thumbPath, assets.thumb.buffer, {
          contentType: assets.thumb.contentType,
          upsert: false,
        });

      if (thumbError) {
        await sb.storage.from("media").remove([originalPath]);
        return NextResponse.json({ error: thumbError.message }, { status: 500 });
      }

      const originalPublic = sb.storage.from("media").getPublicUrl(originalPath);
      const thumbPublic = sb.storage.from("media").getPublicUrl(thumbPath);

      return NextResponse.json({
        image_url: originalPublic.data.publicUrl,
        image_thumb_url: thumbPublic.data.publicUrl,
        path: originalPath,
        thumb_path: thumbPath,
        file_id: fileId,
      });
    }

    return NextResponse.json(
      { error: "ユニークなファイル名で保存できませんでした" },
      { status: 500 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
