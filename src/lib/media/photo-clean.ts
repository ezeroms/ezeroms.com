import convert from "heic-convert";
import sharp from "sharp";
import { createPhotoThumbnail, type PhotoThumbResult } from "@/lib/media/photo-thumb";

/** 保存用オリジナル（メタ削除済み）の JPEG 品質 */
const CLEAN_ORIGINAL_JPEG_QUALITY = 92;

/** ISO BMFF `ftyp` の brand（HEIC / HEIF 系） */
const HEIC_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
  "heif",
]);

export type CleanPhotoAssets = {
  /** 向きを焼き込み、EXIF 等を除去したオリジナル */
  original: {
    buffer: Buffer;
    contentType: "image/jpeg";
    extension: ".jpg";
  };
  thumb: PhotoThumbResult;
};

/** HEIC / HEIF バッファかどうか（拡張子に依存しない） */
export function isHeicBuffer(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf.toString("ascii", 4, 8) !== "ftyp") return false;

  const major = buf.toString("ascii", 8, 12).toLowerCase();
  if (HEIC_BRANDS.has(major)) return true;

  const boxSize = buf.readUInt32BE(0);
  const end = Math.min(buf.length, boxSize > 8 ? boxSize : buf.length);
  for (let offset = 16; offset + 4 <= end; offset += 4) {
    const brand = buf.toString("ascii", offset, offset + 4).toLowerCase();
    if (HEIC_BRANDS.has(brand)) return true;
  }
  return false;
}

async function convertHeicToJpeg(sourceBytes: Buffer): Promise<Buffer> {
  try {
    const jpeg = await convert({
      buffer: sourceBytes,
      format: "JPEG",
      quality: 1,
    });
    return Buffer.from(jpeg);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    throw new Error(
      `HEIC の変換に失敗しました。JPEG に変換してから再度お試しください。（${detail}）`,
    );
  }
}

async function ensureSharpInput(sourceBytes: Buffer): Promise<Buffer> {
  if (isHeicBuffer(sourceBytes)) {
    return convertHeicToJpeg(sourceBytes);
  }
  return sourceBytes;
}

function isLikelyHeifDecodeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /heif|heic|decoder plugin|bad seek/i.test(message);
}

/**
 * EXIF の向きを画素に焼き込んだうえで、メタデータをすべて落とした画像を作る。
 * HEIC / HEIF は先に JPEG へ変換してから処理する。
 * あわせて一覧用サムネも生成する（サムネもメタなし）。
 */
export async function createCleanPhotoAssets(
  sourceBytes: Buffer,
): Promise<CleanPhotoAssets> {
  let input = await ensureSharpInput(sourceBytes);

  try {
    return await buildCleanAssets(input);
  } catch (error) {
    // マジック判定漏れ向け: sharp の HEIF エラー時に heic-convert で再試行
    if (!isHeicBuffer(sourceBytes) && isLikelyHeifDecodeError(error)) {
      input = await convertHeicToJpeg(sourceBytes);
      return buildCleanAssets(input);
    }
    throw error;
  }
}

async function buildCleanAssets(inputBytes: Buffer): Promise<CleanPhotoAssets> {
  // rotate() で Orientation を適用し、出力時にメタを付けない＝プライバシー保護
  const originalBuffer = await sharp(inputBytes)
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
