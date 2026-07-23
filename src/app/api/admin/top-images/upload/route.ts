import { NextRequest, NextResponse } from "next/server";
import { generateContentSlug } from "@/lib/admin/content";
import { createCleanPhotoAssets } from "@/lib/media/photo-clean";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

const MAX_FILENAME_ATTEMPTS = 12;
const FOLDER = "top";

async function allocateUniqueTopFileId(): Promise<string> {
  const sb = getSupabaseAdmin();
  for (let attempt = 0; attempt < MAX_FILENAME_ATTEMPTS; attempt++) {
    const fileId = generateContentSlug(16);
    const { data, error } = await sb.storage.from("media").list(FOLDER, {
      limit: 100,
      search: fileId,
    });
    if (error) {
      throw new Error(`Storage list failed: ${error.message}`);
    }
    const collision = (data ?? []).some(
      (entry) =>
        entry.name === `${fileId}.jpg` ||
        entry.name === `${fileId}-thumb.webp` ||
        entry.name.startsWith(`${fileId}.`) ||
        entry.name.startsWith(`${fileId}-`),
    );
    if (!collision) return fileId;
  }
  throw new Error("ユニークなファイル名を割り当てられませんでした");
}

/** Top image upload: clean JPEG (+ thumb) into media/top/ */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
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

    for (let attempt = 0; attempt < 2; attempt++) {
      const fileId = await allocateUniqueTopFileId();
      const originalPath = `${FOLDER}/${fileId}${assets.original.extension}`;
      const thumbPath = `${FOLDER}/${fileId}-thumb.webp`;

      const { error: originalError } = await sb.storage
        .from("media")
        .upload(originalPath, assets.original.buffer, {
          contentType: assets.original.contentType,
          upsert: false,
        });
      if (originalError) continue;

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
