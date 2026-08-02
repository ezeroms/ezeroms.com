import { generateContentSlug } from "@/lib/admin/content";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_FILENAME_ATTEMPTS = 12;

/**
 * Storage 上で未使用の 16 桁英数字 ID を確保する。
 * `{id}.jpg` / `{id}-thumb.webp` のどちらも無いことを確認する。
 */
export async function allocateUniquePhotoFileId(
  supabase: SupabaseClient,
  gallery: string,
): Promise<string> {
  const folder = `photos/${gallery}`;

  for (let attempt = 0; attempt < MAX_FILENAME_ATTEMPTS; attempt++) {
    const fileId = generateContentSlug(16);
    const { data, error } = await supabase.storage.from("media").list(folder, {
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
