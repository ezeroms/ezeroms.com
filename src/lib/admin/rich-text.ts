import { marked } from "marked";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
});

turndown.addRule("images", {
  filter: "img",
  replacement(_content, node) {
    const el = node as HTMLImageElement;
    const alt = el.getAttribute("alt") ?? "";
    const src = el.getAttribute("src") ?? "";
    if (!src) return "";
    const title = el.getAttribute("title");
    const titlePart = title ? ` "${title}"` : "";
    return `\n\n![${alt}](${src}${titlePart})\n\n`;
  },
});

turndown.addRule("horizontalRule", {
  filter: "hr",
  replacement() {
    return "\n\n---\n\n";
  },
});

/**
 * TipTap の空段落（Enter 連打の空白行）は通常の Markdown 往復で消える。
 * `&nbsp;` だけの段落として残し、再編集・公開 HTML でも行間を保つ。
 *
 * Turndown の HTML パーサは空の `<p></p>` / `<p>&nbsp;</p>` を捨てるため、
 * 先に `<p><br></p>` へ正規化してから変換する。
 */
function normalizeEmptyParagraphsForTurndown(html: string): string {
  return html
    .replace(
      /<p\b[^>]*class=["'][^"']*\brt-blank\b[^"']*["'][^>]*>[\s\S]*?<\/p>/gi,
      "<p><br></p>",
    )
    .replace(/<p>(?:\s|&nbsp;|\u00a0)*<\/p>/gi, "<p><br></p>")
    .replace(
      /<p>(?:\s|&nbsp;|\u00a0)*(?:<br\b[^>]*>\s*)+<\/p>/gi,
      "<p><br></p>",
    );
}

function isVisuallyEmptyParagraph(node: HTMLElement): boolean {
  if (node.nodeName !== "P") return false;
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeName === "BR") continue;
    if (child.nodeType === 3) {
      const text = (child.textContent ?? "")
        .replace(/\u00a0/g, " ")
        .replace(/\u200b/g, "")
        .trim();
      if (text) return false;
      continue;
    }
    // テキスト／BR 以外の要素があれば空ではない
    return false;
  }
  return true;
}

/** TipTap のブロック画像、または画像だけの段落 */
function isImageLikeNode(node: ChildNode | null): boolean {
  if (!node || node.nodeType !== 1) return false;
  const el = node as HTMLElement;
  if (el.nodeName === "IMG") return true;
  if (el.nodeName !== "P") return false;
  const text = (el.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\u200b/g, "")
    .trim();
  if (text) return false;
  const elements = Array.from(el.children).filter((c) => c.nodeName !== "BR");
  return elements.length === 1 && elements[0]!.nodeName === "IMG";
}

function adjacentElementSibling(
  node: HTMLElement,
  direction: "previous" | "next",
): Element | null {
  let sibling: ChildNode | null =
    direction === "previous" ? node.previousSibling : node.nextSibling;
  while (sibling) {
    if (sibling.nodeType === 1) return sibling as Element;
    if (sibling.nodeType === 3 && (sibling.textContent ?? "").trim()) {
      return null;
    }
    sibling =
      direction === "previous" ? sibling.previousSibling : sibling.nextSibling;
  }
  return null;
}

/**
 * TipTap はブロック画像の直前・直後に空段落を残すことがある。
 * これを空白行として保存すると「写真の上に空行」になるので捨てる。
 */
function isEmptyParagraphBesideImage(node: HTMLElement): boolean {
  return (
    isImageLikeNode(adjacentElementSibling(node, "previous")) ||
    isImageLikeNode(adjacentElementSibling(node, "next"))
  );
}

turndown.addRule("emptyParagraph", {
  filter(node) {
    return (
      node.nodeType === 1 && isVisuallyEmptyParagraph(node as HTMLElement)
    );
  },
  replacement(_content, node) {
    const el = node as HTMLElement;
    if (isEmptyParagraphBesideImage(el)) {
      return "\n\n";
    }
    return "\n\n&nbsp;\n\n";
  },
});

/** `&nbsp;` / rt-blank スペーサーを TipTap の空段落へ */
function spacerParagraphsToEditorHtml(html: string): string {
  return html
    .replace(
      /<p\b[^>]*class=["'][^"']*\brt-blank\b[^"']*["'][^>]*>[\s\S]*?<\/p>/gi,
      "<p><br></p>",
    )
    .replace(/<p>(?:&nbsp;|\u00a0|\s)*<\/p>/gi, "<p><br></p>");
}

/** Markdown 上で画像直前・直後の `&nbsp;` スペーサーを除去 */
function stripNbspBesideImagesInMarkdown(md: string): string {
  return md
    .replace(/(?:^|\n)&nbsp;\n+(?=!\[[^\]]*\]\()/g, "\n")
    .replace(/(!\[[^\]]*\]\([^)]+\))\n+&nbsp;(?=\n|$)/g, "$1");
}

/**
 * TipTap / marked が画像の前後に残す空段落を HTML から除去。
 * marked は `![](...)` を `<p><img></p>` にしやすく、TipTap（block image）は
 * それを空の `<p></p>` + `<img>` に分解して「写真の上の空行」になる。
 */
export function stripEmptyParagraphsBesideImagesInHtml(html: string): string {
  return (
    html
      // 画像だけの段落 → ブロック画像（空段落を残さない）
      .replace(
        /<p\b[^>]*>(?:\s|&nbsp;|\u00a0)*<img\b([^>]*)>(?:\s|&nbsp;|\u00a0)*<\/p>/gi,
        "<img$1>",
      )
      // 画像直前の空段落
      .replace(
        /<p>(?:\s|&nbsp;|\u00a0)*(?:<br\b[^>]*>\s*)*<\/p>\s*(?=<img\b)/gi,
        "",
      )
      // 画像直後の空段落（保存・再読込時の余分なスペーサー）
      .replace(
        /(<img\b[^>]*>)\s*<p>(?:\s|&nbsp;|\u00a0)*(?:<br\b[^>]*>\s*)*<\/p>/gi,
        "$1",
      )
  );
}

/**
 * 公開 HTML 用: スペーサー段落を rt-blank にし、通常の段落マージンと
 * 行の高さが二重に乗らないようにする。
 */
export function applyBlankParagraphClass(html: string): string {
  return html.replace(
    /<p>(?:&nbsp;|\u00a0)<\/p>/gi,
    '<p class="rt-blank"><br></p>',
  );
}

/** Markdown → HTML for TipTap initial / sync content. */
export function markdownToEditorHtml(md: string): string {
  const trimmed = stripNbspBesideImagesInMarkdown(md.trim());
  if (!trimmed) return "";
  const parsed = marked.parse(trimmed, { async: false }) as string;
  return stripEmptyParagraphsBesideImagesInHtml(
    spacerParagraphsToEditorHtml(parsed),
  );
}

/** TipTap HTML → Markdown for bio_md storage. */
export function editorHtmlToMarkdown(html: string): string {
  const trimmed = html.trim();
  if (
    !trimmed ||
    trimmed === "<p></p>" ||
    trimmed === "<p><br></p>" ||
    trimmed === '<p><br class="ProseMirror-trailingBreak"></p>' ||
    trimmed === "<p>&nbsp;</p>"
  ) {
    return "";
  }
  const normalized = normalizeEmptyParagraphsForTurndown(trimmed);
  return turndown.turndown(normalized).trim();
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/**
 * Google Calendar の description（多くは HTML）→ エディタ用 Markdown。
 * 素のテキストはそのまま扱う。
 */
export function googleDescriptionToMarkdown(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (looksLikeHtml(trimmed)) {
    return editorHtmlToMarkdown(trimmed);
  }
  return trimmed;
}

/** エディタ Markdown → Google Calendar に渡す HTML。 */
export function markdownToGoogleDescription(md: string): string {
  return markdownToEditorHtml(md);
}
