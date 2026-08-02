/** Storage URL などからファイル名を取り出す */
export function filenameFromImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const path = new URL(trimmed).pathname;
    return decodeURIComponent(path.split("/").filter(Boolean).pop() ?? "");
  } catch {
    return trimmed.split("?")[0]?.split("/").filter(Boolean).pop() ?? "";
  }
}

/** 拡張子を除いた部分（通常は 16 桁 ID）を slug 候補にする */
export function slugFromFilename(filename: string): string {
  return filename.trim().replace(/\.[^.]+$/, "");
}
