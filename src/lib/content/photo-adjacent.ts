import type { Photo } from "@/types/content";

export type AdjacentPhotos = {
  /** 一覧（新しい順）で後ろ＝より古い写真 */
  olderPhoto: Photo | null;
  /** 一覧（新しい順）で前＝より新しい写真 */
  newerPhoto: Photo | null;
};

/**
 * 日付が新しい順に並んだ写真リストから、指定 slug の前後を返す。
 * 詳細ページの「前へ／次へ」カードと getAdjacentPhoto で共通利用する。
 */
export function findAdjacentPhotosInList(
  photosNewestFirst: Photo[],
  slug: string,
): AdjacentPhotos {
  const index = photosNewestFirst.findIndex((photo) => photo.slug === slug);
  if (index < 0) {
    return { olderPhoto: null, newerPhoto: null };
  }

  const olderPhoto =
    index < photosNewestFirst.length - 1
      ? photosNewestFirst[index + 1]!
      : null;
  const newerPhoto = index > 0 ? photosNewestFirst[index - 1]! : null;

  return { olderPhoto, newerPhoto };
}

/** ギャラリー詳細ページのパス（末尾スラッシュ付き）を組み立てる */
export function photoDetailHref(basePath: string, photoSlug: string): string {
  return `${basePath}${photoSlug}/`;
}
