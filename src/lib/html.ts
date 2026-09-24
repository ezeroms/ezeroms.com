import sanitizeHtml from "sanitize-html";
import {
  parseYoutubeVideoId,
  youtubeEmbedSrc,
} from "@/lib/content/clip-meta";
import {
  parseSpotifyEmbed,
  spotifyEmbedHeight,
  spotifyEmbedSrc,
  spotifyEmbedVariant,
  type SpotifyEmbed,
} from "@/lib/content/spotify-embed";
import { repairLiteralMarkdownInHtml } from "@/lib/content/legacy-markdown";
import {
  applyBlankParagraphClass,
  expandAlignBlocks,
} from "@/lib/admin/rich-text";

/** Responsive 16:9 YouTube block for body HTML. */
export function youtubeEmbedBlock(videoId: string): string {
  const src = youtubeEmbedSrc(videoId);
  return (
    `<div class="youtube-embed">` +
    `<iframe src="${src}" title="YouTube video" ` +
    `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ` +
    `allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin">` +
    `</iframe></div>`
  );
}

/**
 * Turn standalone YouTube links / bare embed iframes into full-width responsive embeds.
 * Inline “watch this” links in running text stay as normal anchors.
 * Safe to run before sanitizeBody.
 */
export function embedYoutubeInHtml(html: string): string {
  if (!html) return html;

  let out = html;

  // Paragraph whose only content is a YouTube link → embed
  out = out.replace(
    /<p>\s*<a\b[^>]*\bhref=(["'])([^"']+)\1[^>]*>[\s\S]*?<\/a>\s*<\/p>/gi,
    (match, _q, href: string) => {
      if (href.startsWith("youtube:")) {
        const id = href.slice("youtube:".length);
        if (/^[\w-]{11}$/.test(id)) return youtubeEmbedBlock(id);
      }
      const id = parseYoutubeVideoId(href);
      return id ? youtubeEmbedBlock(id) : match;
    },
  );

  // Empty legacy `youtube:ID` anchors (often from `[](youtube:…)`)
  out = out.replace(
    /<a\b[^>]*\bhref=(["'])youtube:([\w-]{11})\1[^>]*>\s*<\/a>/gi,
    (_m, _q, id: string) => youtubeEmbedBlock(id),
  );

  // Existing YouTube iframes not already wrapped
  out = out.replace(
    /(?:<div class="youtube-embed">[\s\S]*?<\/div>)|(<iframe\b[^>]*\bsrc=["']https?:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com)\/embed\/([\w-]{11})[^"']*["'][^>]*>\s*<\/iframe>)/gi,
    (match, iframe: string | undefined, id: string | undefined) =>
      iframe && id ? youtubeEmbedBlock(id) : match,
  );

  // Collapse accidental double wraps
  out = out.replace(
    /<div class="youtube-embed">\s*<div class="youtube-embed">([\s\S]*?)<\/div>\s*<\/div>/gi,
    '<div class="youtube-embed">$1</div>',
  );

  // Don't leave embeds trapped in empty paragraphs
  out = out.replace(
    /<p>\s*(<div class="youtube-embed">[\s\S]*?<\/div>)\s*<\/p>/gi,
    "$1",
  );

  return out;
}

/** Compact (track/episode) or expanded Spotify iframe for body HTML. */
export function spotifyEmbedBlock(embed: SpotifyEmbed): string {
  const src = spotifyEmbedSrc(embed);
  const height = spotifyEmbedHeight(embed.type);
  const variant = spotifyEmbedVariant(embed.type);
  const title = `Spotify ${embed.type}`;
  return (
    `<div class="spotify-embed spotify-embed--${variant}">` +
    `<iframe src="${src}" title="${title}" ` +
    `width="100%" height="${height}" ` +
    `allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" ` +
    `allowfullscreen loading="lazy">` +
    `</iframe></div>`
  );
}

/**
 * Turn standalone Spotify links / bare embed iframes into widgets.
 * Inline “listen here” links in running text stay as normal anchors.
 * Safe to run before sanitizeBody.
 */
export function embedSpotifyInHtml(html: string): string {
  if (!html) return html;

  let out = html;

  out = out.replace(
    /<p>\s*<a\b[^>]*\bhref=(["'])([^"']+)\1[^>]*>[\s\S]*?<\/a>\s*<\/p>/gi,
    (match, _q, href: string) => {
      const parsed = parseSpotifyEmbed(href);
      return parsed ? spotifyEmbedBlock(parsed) : match;
    },
  );

  out = out.replace(
    /<a\b[^>]*\bhref=(["'])(spotify:(?:track|album|playlist|episode|show|artist|podcast)[:/][0-9A-Za-z]+)\1[^>]*>\s*<\/a>/gi,
    (match, _q, href: string) => {
      const parsed = parseSpotifyEmbed(href);
      return parsed ? spotifyEmbedBlock(parsed) : match;
    },
  );

  out = out.replace(
    /(?:<div class="spotify-embed\b[^"]*">[\s\S]*?<\/div>)|(<iframe\b[^>]*\bsrc=["']https?:\/\/open\.spotify\.com\/embed\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode|show|artist)\/([0-9A-Za-z]{22})[^"']*["'][^>]*>\s*<\/iframe>)/gi,
    (match, iframe: string | undefined, type: string | undefined, id: string | undefined) => {
      if (!iframe || !type || !id) return match;
      const parsed = parseSpotifyEmbed(`spotify:${type}/${id}`);
      return parsed ? spotifyEmbedBlock(parsed) : match;
    },
  );

  out = out.replace(
    /<div class="spotify-embed\b[^"]*">\s*<div class="spotify-embed\b[^"]*">([\s\S]*?)<\/div>\s*<\/div>/gi,
    '<div class="spotify-embed">$1</div>',
  );

  out = out.replace(
    /<p>\s*(<div class="spotify-embed\b[^"]*">[\s\S]*?<\/div>)\s*<\/p>/gi,
    "$1",
  );

  return out;
}

/** Expand `[](youtube:ID)` / `[](spotify:type/ID)` (and labeled variants) before markdown parse. */
export function preprocessMarkdownMedia(md: string): string {
  let out = expandAlignBlocks(md).replace(
    /\[([^\]]*)\]\(youtube:([\w-]{11})\)/g,
    (_m, _text, id: string) => youtubeEmbedBlock(id),
  );
  out = out.replace(
    /\[([^\]]*)\]\(spotify:(track|album|playlist|episode|show|artist|podcast)[:/]([0-9A-Za-z]+)\)/gi,
    (match, _text, type: string, id: string) => {
      const parsed = parseSpotifyEmbed(`spotify:${type}/${id}`);
      return parsed ? spotifyEmbedBlock(parsed) : match;
    },
  );
  return out;
}

function decodeBasicHtmlEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseHtmlAttr(tag: string, name: string): string | null {
  const re = new RegExp(
    `(?:^|[\\s])${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
    "i",
  );
  const match = tag.match(re);
  if (!match) return null;
  return decodeBasicHtmlEntities(match[1] ?? match[2] ?? "");
}

function wrapImgTagAsFigure(imgTag: string): string {
  const title = parseHtmlAttr(imgTag, "title")?.trim();
  if (!title) return imgTag;
  return (
    `<figure>${imgTag}<figcaption>${escapeHtmlText(title)}</figcaption></figure>`
  );
}

/**
 * `title` 付きの本文画像を `<figure>` / `<figcaption>` にする。
 * 既存の figure は触らない。エディタ HTML（注釈なしの img）はそのまま。
 */
export function wrapTitledImagesAsFigures(html: string): string {
  if (!html || !/\btitle\s*=/i.test(html)) return html;

  const parts = html.split(/(<figure\b[\s\S]*?<\/figure>)/gi);
  return parts
    .map((part) => {
      if (/^<figure\b/i.test(part)) return part;
      return part.replace(
        /<p>\s*(<img\b[^>]*>)\s*<\/p>|<img\b[^>]*>/gi,
        (match, imgInP?: string) => {
          const img = imgInP ?? match;
          const wrapped = wrapImgTagAsFigure(img);
          return wrapped === img ? match : wrapped;
        },
      );
    })
    .join("");
}

/**
 * 移行データで ```…``` が `<p>` 内に残っている場合を `<pre><code>` に直す。
 * （Markdown フェンスがエスケープされたまま HTML 化されたレガシー行向け）
 */
export function repairLegacyCodeFencesInHtml(html: string): string {
  if (!html.includes("```")) return html;

  const repaired = html.replace(
    /```(\w*)\s*([\s\S]*?)```/g,
    (_match, lang: string, body: string) => {
      const text = decodeBasicHtmlEntities(
        body
          .replace(/<\/p>\s*<p>/gi, "\n")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/?p>/gi, "\n")
          .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
          .replace(/<[^>]+>/g, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim(),
      );
      const langClass = lang ? ` class="language-${lang}"` : "";
      return `<pre><code${langClass}>${escapeHtmlText(text)}</code></pre>`;
    },
  );

  // `<p><pre>…</pre></p>` を解く
  return repaired.replace(/<p>\s*(<pre>[\s\S]*?<\/pre>)\s*<\/p>/gi, "$1");
}

function internalHostnames(): Set<string> {
  const hosts = new Set<string>(["ezeroms.com"]);
  try {
    const fromEnv = new URL(
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        "https://ezeroms.com",
    )
      .hostname.replace(/^www\./i, "")
      .toLowerCase();
    if (fromEnv) hosts.add(fromEnv);
  } catch {
    /* keep canonical fallback */
  }
  return hosts;
}

/**
 * http(s) links that leave this site. Relative, hash, mailto, and tel stay in-tab.
 */
function isExternalHttpHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("?") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return false;
  }
  try {
    const url = new URL(trimmed, "https://ezeroms.com");
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    return !internalHostnames().has(host);
  } catch {
    return false;
  }
}

function mergeRel(existing: string | undefined, extra: string[]): string {
  const tokens = new Set(
    `${existing ?? ""} ${extra.join(" ")}`.split(/\s+/).filter(Boolean),
  );
  return [...tokens].join(" ");
}

function decorateExternalAnchor(
  attribs: Record<string, string>,
): Record<string, string> {
  if (!isExternalHttpHref(attribs.href ?? "")) return attribs;
  const next = { ...attribs };
  if (!next.target) next.target = "_blank";
  if (next.target === "_blank") {
    next.rel = mergeRel(next.rel, ["noopener", "noreferrer"]);
  }
  return next;
}

export function sanitizeBody(html: string): string {
  return sanitizeHtml(
    wrapTitledImagesAsFigures(
      applyBlankParagraphClass(
        embedSpotifyInHtml(
          embedYoutubeInHtml(
            repairLegacyCodeFencesInHtml(repairLiteralMarkdownInHtml(html)),
          ),
        ),
      ),
    ),
    {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "video",
      "h1",
      "h2",
      "iframe",
      "figure",
      "figcaption",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height", "loading"],
      video: ["src", "controls", "playsinline", "preload", "poster"],
      a: ["href", "name", "target", "rel"],
      iframe: [
        "src",
        "width",
        "height",
        "allow",
        "allowfullscreen",
        "frameborder",
        "loading",
        "referrerpolicy",
        "title",
      ],
      "*": ["class", "id", "style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(?:left|center|right)$/],
      },
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "youtube.com",
      "www.youtube-nocookie.com",
      "youtube-nocookie.com",
      "open.spotify.com",
    ],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: decorateExternalAnchor(attribs),
      }),
    },
  },
  );
}
