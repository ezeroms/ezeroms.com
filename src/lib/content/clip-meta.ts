export function clipSourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** カード／一覧の出典表示（保存名 → YouTube → ホスト名） */
export function clipSourceLabel(
  sourceUrl: string,
  sourceName?: string | null,
): string {
  const name = (sourceName ?? "").trim();
  if (name) return name;
  if (parseYoutubeVideoId(sourceUrl)) return "YouTube";
  return clipSourceHost(sourceUrl) || "—";
}

export function formatClipDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * YouTube / youtu.be / shorts / embed URL から動画 ID を取り出す。
 * 該当しなければ null（通常の記事クリップとして扱う）。
 */
export function parseYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return isYoutubeVideoId(id) ? id : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const v = parsed.searchParams.get("v");
      if (isYoutubeVideoId(v)) return v;

      const parts = parsed.pathname.split("/").filter(Boolean);
      // /embed/ID, /shorts/ID, /live/ID, /v/ID
      if (
        parts.length >= 2 &&
        ["embed", "shorts", "live", "v"].includes(parts[0])
      ) {
        const id = parts[1];
        return isYoutubeVideoId(id) ? id : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function isYoutubeVideoId(value: string | null | undefined): value is string {
  return Boolean(value && /^[\w-]{11}$/.test(value));
}

export function isYoutubeClipUrl(url: string): boolean {
  return parseYoutubeVideoId(url) != null;
}

/** カード内埋め込み用（プライバシー強化ドメイン） */
export function youtubeEmbedSrc(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
