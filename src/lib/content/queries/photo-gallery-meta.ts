import { notFound } from "next/navigation";
import {
  getPhotoGallery,
  isPhotoGalleryPublic,
  isPhotoGalleryStatus,
  type PhotoGalleryId,
  type PhotoGalleryMeta,
  type PhotoGalleryStatus,
  PHOTO_GALLERIES,
} from "@/lib/content/photo-galleries";
import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  isMissingColumnError,
  isSchemaNotReadyError,
  logQueryError,
} from "@/lib/content/queries/_shared";

function parseStatus(value: unknown, fallback: PhotoGalleryStatus): PhotoGalleryStatus {
  return typeof value === "string" && isPhotoGalleryStatus(value)
    ? value
    : fallback;
}

function parseOgImage(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * DB の photo_gallery を読み、無ければコード上の既定値にフォールバックする。
 */
export async function loadPhotoGallery(
  galleryId: PhotoGalleryId,
): Promise<PhotoGalleryMeta> {
  const defaults = getPhotoGallery(galleryId);

  if (!hasSupabaseConfig()) return defaults;

  try {
    const db = getSupabaseAdmin();
    let { data, error } = await db
      .from("photo_gallery")
      .select("id, label, description, status, og_image")
      .eq("id", galleryId)
      .maybeSingle();

    // og_image マイグレーション前は列なしで再取得
    if (error && isMissingColumnError(error)) {
      ({ data, error } = await db
        .from("photo_gallery")
        .select("id, label, description, status")
        .eq("id", galleryId)
        .maybeSingle());
    }

    if (error) {
      if (!isSchemaNotReadyError(error)) {
        logQueryError(`[loadPhotoGallery:${galleryId}]`, error);
      }
      return defaults;
    }

    if (!data) return defaults;

    return {
      ...defaults,
      label: (data.label as string)?.trim() || defaults.label,
      description:
        typeof data.description === "string"
          ? data.description
          : defaults.description,
      status: parseStatus(data.status, defaults.status),
      og_image:
        parseOgImage(
          "og_image" in data ? (data as { og_image?: unknown }).og_image : "",
        ) || defaults.og_image,
    };
  } catch (error) {
    logQueryError(`[loadPhotoGallery:${galleryId}]`, error);
    return defaults;
  }
}

/** 公開サイトのサイドナビ等に出すギャラリー一覧（非公開は除外） */
export async function listPublicPhotoGalleries(): Promise<PhotoGalleryMeta[]> {
  const ids = Object.keys(PHOTO_GALLERIES) as PhotoGalleryId[];
  const galleries = await Promise.all(ids.map((id) => loadPhotoGallery(id)));
  return galleries.filter(isPhotoGalleryPublic);
}

/** 公開ページ用。非公開なら 404。 */
export async function requirePublicPhotoGallery(
  galleryId: PhotoGalleryId,
): Promise<PhotoGalleryMeta> {
  const gallery = await loadPhotoGallery(galleryId);
  if (!isPhotoGalleryPublic(gallery)) notFound();
  return gallery;
}
