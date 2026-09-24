/** Supabase Storage の標準上限に合わせる */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const TYPE_TO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const EXT_TO_TYPE: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export function videoFileMeta(
  file: Pick<File, "name" | "type">,
): { contentType: string; extension: string } | null {
  const type = file.type.toLowerCase();
  const fromType = TYPE_TO_EXT[type];
  if (fromType) return { contentType: type, extension: fromType };

  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const contentType = EXT_TO_TYPE[ext];
  if (!contentType) return null;
  return {
    contentType,
    extension: ext === "m4v" ? "mp4" : ext,
  };
}

export function isVideoFile(file: Pick<File, "name" | "type">): boolean {
  return videoFileMeta(file) != null;
}
