import type { Photo } from "@/types/content";
import { formatPhotoDate } from "@/lib/content/photo-filter";

/**
 * ギャラリー／ライトボックス用の短いキャプション。
 * 公開一覧には出さず、拡大表示や alt に使う。
 */
export function formatPhotoCaption(photo: Photo): string {
  const parts = [formatPhotoDate(photo.date), photo.location?.trim()].filter(
    Boolean,
  );
  return parts.join(" · ");
}

/** アクセシビリティ用ラベル（キャプションが空なら「写真」）。 */
export function photoAccessibilityLabel(photo: Photo): string {
  return formatPhotoCaption(photo) || "写真";
}

/** 画像 URL がある写真だけに絞る（ギャラリー表示対象）。 */
export function photosWithImageUrl(photos: Photo[]): Photo[] {
  return photos.filter((photo) => Boolean(photo.image_url?.trim()));
}

/**
 * グリッド・管理一覧用の表示 URL。
 * サムネがあればそれを使い、なければオリジナルにフォールバックする。
 */
export function photoGridSrc(
  photo: Pick<Photo, "image_url" | "image_thumb_url">,
): string | null {
  const thumb = photo.image_thumb_url?.trim();
  if (thumb) return thumb;
  const original = photo.image_url?.trim();
  return original || null;
}

/** ライトボックス・詳細ページ用（常にオリジナル） */
export function photoOriginalSrc(
  photo: Pick<Photo, "image_url">,
): string | null {
  const original = photo.image_url?.trim();
  return original || null;
}
