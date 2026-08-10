/**
 * Vercel の Serverless リクエストボディ上限（約 4.5MB）を超えないよう、
 * ブラウザ側で JPEG にリサイズ・再エンコードする。
 */

/** multipart オーバーヘッド分を見て余裕を残す */
export const MAX_UPLOAD_BYTES = 3_500_000;
const DEFAULT_MAX_EDGE_PX = 2560;
/** 写真ギャラリー向け（Web 表示に十分な長辺） */
export const PHOTO_MAX_EDGE_PX = 4096;
const QUALITY_STEPS = [0.88, 0.8, 0.72, 0.64, 0.55, 0.45];

export type CompressImageOptions = {
  maxBytes?: number;
  maxEdgePx?: number;
};

function isHeicLike(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch (error) {
    // HEIC などブラウザ未対応はここで落ちる
    throw error;
  }
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("画像の圧縮に失敗しました"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

function jpegFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  return `${base}.jpg`;
}

/**
 * アップロード前に JPEG へ圧縮。既に十分小さければそのまま返す。
 * デコードできない HEIC 等が上限超過のときは分かりやすい Error を投げる。
 */
export async function compressImageForUpload(
  file: File,
  options?: CompressImageOptions,
): Promise<File> {
  const maxBytes = options?.maxBytes ?? MAX_UPLOAD_BYTES;
  const maxEdgePx = options?.maxEdgePx ?? DEFAULT_MAX_EDGE_PX;

  if (file.size <= maxBytes && !isHeicLike(file)) {
    // 小さい JPEG/PNG/WebP はそのまま（サーバー側でメタ削除）
    if (file.type.startsWith("image/") || !file.type) {
      return file;
    }
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    if (file.size > maxBytes) {
      throw new Error(
        `画像が大きすぎます（${(file.size / 1024 / 1024).toFixed(1)}MB）。` +
          `JPEG/PNG に変換するか、${Math.floor(maxBytes / 1024 / 1024)}MB 以下にしてください。`,
      );
    }
    // 小さい HEIC 等はサーバー変換に任せる
    return file;
  }

  try {
    const scale = Math.min(1, maxEdgePx / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("画像の圧縮に失敗しました");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    let best: Blob | null = null;
    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToJpegBlob(canvas, quality);
      best = blob;
      if (blob.size <= maxBytes) break;
    }

    if (!best) {
      throw new Error("画像の圧縮に失敗しました");
    }
    if (best.size > maxBytes) {
      throw new Error(
        `圧縮後も画像が大きすぎます（${(best.size / 1024 / 1024).toFixed(1)}MB）。` +
          `解像度を下げて再度お試しください。`,
      );
    }

    // 圧縮しても元より大きい／同程度なら元を使う（ただし上限内のときだけ）
    if (file.size <= maxBytes && best.size >= file.size * 0.95) {
      return file;
    }

    return new File([best], jpegFileName(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
