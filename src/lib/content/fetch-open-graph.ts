/** Fetch Open Graph / Twitter Card metadata from a URL (best-effort). */

export type OpenGraphData = {
  image: string;
  title: string;
  description: string;
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
    .replace(/&gt;/g, ">");
}

function absoluteUrl(base: string, maybeRelative: string): string {
  if (!maybeRelative) return "";
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return maybeRelative;
  }
}

/**
 * Best-effort scrape of og/twitter meta. Failures return empty strings
 * (clip save should still succeed without OGP).
 */
export async function fetchOpenGraph(url: string): Promise<OpenGraphData> {
  const empty: OpenGraphData = { image: "", title: "", description: "" };
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

    const html = (await res.text()).slice(0, 400_000);
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

    return { image, title, description };
  } catch {
    return empty;
  }
}
