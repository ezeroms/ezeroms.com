import sharp from "sharp";
import { createPhotoThumbnail, type PhotoThumbResult } from "@/lib/media/photo-thumb";

/** 保存用オリジナル（メタ削除済み）の JPEG 品質 */
const CLEAN_ORIGINAL_JPEG_QUALITY = 92;

export type CleanPhotoAssets = {
  /** 向きを焼き込み、EXIF 等を除去したオリジナル */
  original: {
    buffer: Buffer;
    contentType: "image/jpeg";
    extension: ".jpg";
  };
  thumb: PhotoThumbResult;
};

/**
 * EXIF の向きを画素に焼き込んだうえで、メタデータをすべて落とした画像を作る。
 * あわせて一覧用サムネも生成する（サムネもメタなし）。
 */
export async function createCleanPhotoAssets(
  sourceBytes: Buffer,
): Promise<CleanPhotoAssets> {
  // rotate() で Orientation を適用し、出力時にメタを付けない＝プライバシー保護
  const originalBuffer = await sharp(sourceBytes)
    .rotate()
    .jpeg({ quality: CLEAN_ORIGINAL_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  const thumb = await createPhotoThumbnail(originalBuffer);

  return {
    original: {
      buffer: originalBuffer,
      contentType: "image/jpeg",
      extension: ".jpg",
    },
    thumb,
  };
}
