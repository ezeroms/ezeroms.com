import sharp from "sharp";

/** 一覧用サムネの長辺上限（px）。クリック拡大はオリジナルを使う。 */
export const PHOTO_THUMB_MAX_EDGE = 960;

/** WebP 品質。見た目を保ちつつファイルサイズを落とす。 */
export const PHOTO_THUMB_WEBP_QUALITY = 72;

export type PhotoThumbResult = {
  buffer: Buffer;
  contentType: "image/webp";
  extension: ".webp";
};

/**
 * オリジナル画像バイトから一覧用の軽量 WebP を作る。
 * 長辺を PHOTO_THUMB_MAX_EDGE 以下にし、メタデータは落とす。
 */
export async function createPhotoThumbnail(
  originalBytes: Buffer,
): Promise<PhotoThumbResult> {
  const buffer = await sharp(originalBytes)
    .rotate() // EXIF の向きを反映してからリサイズ
    .resize({
      width: PHOTO_THUMB_MAX_EDGE,
      height: PHOTO_THUMB_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: PHOTO_THUMB_WEBP_QUALITY })
    .toBuffer();

  return {
    buffer,
    contentType: "image/webp",
    extension: ".webp",
  };
}
