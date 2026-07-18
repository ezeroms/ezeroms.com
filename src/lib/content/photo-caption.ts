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
