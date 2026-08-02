/** Fetch Open Graph / Twitter Card metadata from a URL (best-effort). */

export type OpenGraphData = {
  image: string;
  title: string;
  description: string;
  /** og:site_name など（なければ空） */
  siteName: string;
};

function metaContent(html: string, keys: string[]): string {
  for (const key of keys) {
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
        "i",
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return decodeHtmlEntities(m[1].trim());
    }
  }
  return "";
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10)),
    );
}

function absoluteUrl(base: string, maybeRelative: string): string {
  if (!maybeRelative) return "";
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return maybeRelative;
  }
}

/** TextDecoder が受け付けるラベルへ正規化（ITmedia 等の Shift_JIS 向け）。 */
function normalizeCharset(raw: string): string {
  const c = raw.trim().toLowerCase().replace(/_/g, "-");
  if (
    c === "shift-jis" ||
    c === "sjis" ||
    c === "x-sjis" ||
    c === "windows-31j" ||
    c === "cp932" ||
    c === "ms932"
  ) {
    return "shift_jis";
  }
  if (c === "euc-jp" || c === "eucjp" || c === "x-euc-jp") return "euc-jp";
  if (c === "iso-2022-jp") return "iso-2022-jp";
  if (c === "utf8" || c === "utf-8") return "utf-8";
  return c || "utf-8";
}

/**
 * Content-Type ヘッダと HTML 先頭の meta charset から文字コードを推定する。
 * `res.text()` は常に UTF-8 扱いなので、日本語サイトでは ArrayBuffer 経由でデコードする。
 */
function detectCharset(contentType: string, bytes: Uint8Array): string {
  const fromHeader = contentType.match(/charset\s*=\s*["']?([^\s;"']+)/i);
  if (fromHeader?.[1]) return normalizeCharset(fromHeader[1]);

  const head = new TextDecoder("latin1").decode(bytes.slice(0, 8192));
  const fromMeta =
    head.match(/<meta[^>]+charset\s*=\s*["']?\s*([a-zA-Z0-9_-]+)/i) ||
    head.match(
      /<meta[^>]+http-equiv\s*=\s*["']?content-type["'][^>]+content\s*=\s*["'][^"']*charset\s*=\s*([a-zA-Z0-9_-]+)/i,
    ) ||
    head.match(
      /<meta[^>]+content\s*=\s*["'][^"']*charset\s*=\s*([a-zA-Z0-9_-]+)["'][^>]+http-equiv\s*=\s*["']?content-type/i,
    );
  if (fromMeta?.[1]) return normalizeCharset(fromMeta[1]);

  return "utf-8";
}

function decodeHtmlBytes(bytes: Uint8Array, contentType: string): string {
  const charset = detectCharset(contentType, bytes);
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    // 未知ラベルなどは UTF-8 にフォールバック
    return new TextDecoder("utf-8").decode(bytes);
  }
}

/**
 * Best-effort scrape of og/twitter meta. Failures return empty strings
 * (clip save should still succeed without OGP).
 */
export async function fetchOpenGraph(url: string): Promise<OpenGraphData> {
  const empty: OpenGraphData = {
    image: "",
    title: "",
    description: "",
    siteName: "",
  };
  try {
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    return empty;
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; ezeroms-clips/1.0; +https://ezeroms.com)",
      },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) return empty;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("xml")) {
      return empty;
    }

    const bytes = new Uint8Array(await res.arrayBuffer()).slice(0, 400_000);
    const html = decodeHtmlBytes(bytes, contentType);
    const image = absoluteUrl(
      url,
      metaContent(html, [
        "og:image",
        "og:image:url",
        "twitter:image",
        "twitter:image:src",
      ]),
    );
    const title = metaContent(html, ["og:title", "twitter:title"]);
    const description = metaContent(html, [
      "og:description",
      "twitter:description",
      "description",
    ]);
    const siteName = metaContent(html, [
      "og:site_name",
      "application-name",
    ]);

    return { image, title, description, siteName };
  } catch {
    return empty;
  }
}
