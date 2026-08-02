import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  isMissingRelationError,
  logQueryError,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { findAdjacentPhotosInList } from "@/lib/content/photo-adjacent";
import { resolvePhotoDbTable } from "@/lib/content/photo-db";
import type { Photo } from "@/types/content";

function normalizePhotoRow(row: Photo): Photo {
  return {
    ...row,
    photo_tag: row.photo_tag ?? [],
    location: row.location ?? null,
    camera: row.camera ?? null,
    image_url: row.image_url ?? null,
    image_thumb_url: row.image_thumb_url ?? null,
    body_html: row.body_html ?? "",
  };
}

async function listPhotosFromFs(
  gallery: PhotoGalleryId,
): Promise<{ items: Photo[]; total: number }> {
  const { listPhotoMarkdown } = await import("@/lib/content/photo-fs");
  const items = listPhotoMarkdown(gallery);
  return { items, total: items.length };
}

export async function listPhotos(
  gallery: PhotoGalleryId,
): Promise<{ items: Photo[]; total: number }> {
  if (hasSupabaseConfig()) {
    try {
      const { table } = await resolvePhotoDbTable(gallery);
      const { data, error, count } = await getSupabaseAdmin()
        .from(table)
        .select("*", { count: "exact" })
        .eq("status", PUBLISHED)
        .eq("is_deleted", false)
        .order("date", { ascending: false });

      if (error) {
        if (isMissingRelationError(error)) {
          return listPhotosFromFs(gallery);
        }
        throw error;
      }

      const items = ((data ?? []) as Photo[]).map(normalizePhotoRow);
      if (items.length) {
        return { items, total: count ?? items.length };
      }
    } catch (error) {
      logQueryError(`[listPhotos:${gallery}]`, error);
    }
  }

  return listPhotosFromFs(gallery);
}

export async function getPhotoBySlug(
  gallery: PhotoGalleryId,
  slug: string,
): Promise<Photo | null> {
  if (hasSupabaseConfig()) {
    try {
      const { table } = await resolvePhotoDbTable(gallery);
      const { data, error } = await getSupabaseAdmin()
        .from(table)
        .select("*")
        .eq("slug", slug)
        .eq("status", PUBLISHED)
        .eq("is_deleted", false)
        .maybeSingle();

      if (error) {
        if (!isMissingRelationError(error)) {
          logQueryError(`[getPhotoBySlug:${gallery}]`, error);
        }
      } else if (data) {
        return normalizePhotoRow(data as Photo);
      }
    } catch (error) {
      logQueryError(`[getPhotoBySlug:${gallery}]`, error);
    }
  }

  const { readPhotoMarkdown } = await import("@/lib/content/photo-fs");
  return readPhotoMarkdown(gallery, slug);
}

/**
 * 公開ギャラリーを日付新しい順で見たときの隣接写真。
 * - previous: より古い
 * - next: より新しい
 *
 * 戻り値キー previous / next は既存呼び出し互換のため維持。
 */
export async function getAdjacentPhoto(
  gallery: PhotoGalleryId,
  slug: string,
): Promise<{ previous: Photo | null; next: Photo | null }> {
  const { items } = await listPhotos(gallery);
  const { olderPhoto, newerPhoto } = findAdjacentPhotosInList(items, slug);
  return {
    previous: olderPhoto,
    next: newerPhoto,
  };
}
