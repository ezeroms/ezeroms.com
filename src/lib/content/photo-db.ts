import {
  getPhotoGallery,
  type PhotoGalleryId,
} from "@/lib/content/photo-galleries";
import { isMissingRelationError } from "@/lib/content/queries/_shared";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type ResolvedPhotoTable = {
  /** 実際にクエリするテーブル名 */
  table: string;
  /** smile 未作成のため旧 snap を使っているとき true */
  usingLegacySnap: boolean;
};

/**
 * Photo ギャラリーの実テーブルを解決する。
 * smile / jumpai / kuikake が未作成のあいだは、smile のみ旧 `snap` にフォールバックする。
 */
export async function resolvePhotoDbTable(
  galleryId: PhotoGalleryId,
): Promise<ResolvedPhotoTable> {
  const intended = getPhotoGallery(galleryId).table;
  const sb = getSupabaseAdmin();

  const { error } = await sb
    .from(intended)
    .select("id", { count: "exact", head: true });

  if (!error) {
    return { table: intended, usingLegacySnap: false };
  }

  if (galleryId === "smile" && isMissingRelationError(error)) {
    const snapProbe = await sb
      .from("snap")
      .select("id", { count: "exact", head: true });
    if (!snapProbe.error) {
      return { table: "snap", usingLegacySnap: true };
    }
  }

  // テーブルが無くても呼び出し側でエラー表示できるよう intended を返す
  return { table: intended, usingLegacySnap: false };
}

/** 旧 snap には無いカラムを付けない */
export function isLegacySnapTable(table: string): boolean {
  return table === "snap";
}
