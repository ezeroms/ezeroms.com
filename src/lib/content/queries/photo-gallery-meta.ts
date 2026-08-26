import {
  getPhotoGallery,
  isPhotoGalleryPublic,
  isPhotoGalleryStatus,
  type PhotoGalleryId,
  type PhotoGalleryMeta,
  PHOTO_GALLERIES,
} from "@/lib/content/photo-galleries";
import {
  listMappedPublic,
  loadSectionMeta,
  requirePublicOrNotFound,
} from "@/lib/content/queries/section-meta-query";

/**
 * DB の photo_gallery を読み、無ければコード上の既定値にフォールバックする。
 */
export async function loadPhotoGallery(
  galleryId: PhotoGalleryId,
): Promise<PhotoGalleryMeta> {
  return loadSectionMeta({
    table: "photo_gallery",
    id: galleryId,
    defaults: getPhotoGallery(galleryId),
    isAllowedStatus: isPhotoGalleryStatus,
    logLabel: `[loadPhotoGallery:${galleryId}]`,
    // 空文字は「説明なし」として残す（コード既定に戻さない）
    keepEmptyDescription: true,
  });
}

/** 公開サイトのサイドナビ等に出すギャラリー一覧（非公開は除外） */
export async function listPublicPhotoGalleries(): Promise<PhotoGalleryMeta[]> {
  const ids = Object.keys(PHOTO_GALLERIES) as PhotoGalleryId[];
  return listMappedPublic(ids, loadPhotoGallery, isPhotoGalleryPublic);
}

/** 公開ページ用。非公開なら 404。 */
export async function requirePublicPhotoGallery(
  galleryId: PhotoGalleryId,
): Promise<PhotoGalleryMeta> {
  return requirePublicOrNotFound(
    await loadPhotoGallery(galleryId),
    isPhotoGalleryPublic,
  );
}
