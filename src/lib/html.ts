import sanitizeHtml from "sanitize-html";
import {
  parseYoutubeVideoId,
  youtubeEmbedSrc,
} from "@/lib/content/clip-meta";
import { repairLiteralMarkdownInHtml } from "@/lib/content/legacy-markdown";

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

/** Expand `[](youtube:ID)` (and labeled variants) before markdown parse. */
export function preprocessMarkdownMedia(md: string): string {
  return md.replace(
    /\[([^\]]*)\]\(youtube:([\w-]{11})\)/g,
    (_m, _text, id: string) => youtubeEmbedBlock(id),
  );
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

export function sanitizeBody(html: string): string {
  return sanitizeHtml(
    embedYoutubeInHtml(
      repairLegacyCodeFencesInHtml(repairLiteralMarkdownInHtml(html)),
    ),
    {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "iframe",
      "figure",
      "figcaption",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height", "loading"],
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
      "*": ["class", "id"],
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "youtube.com",
      "www.youtube-nocookie.com",
      "youtube-nocookie.com",
      "open.spotify.com",
    ],
  },
  );
}
