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

/** Markdown → HTML for TipTap initial / sync content. */
export function markdownToEditorHtml(md: string): string {
  const trimmed = md.trim();
  if (!trimmed) return "";
  return marked.parse(trimmed, { async: false }) as string;
}

/** TipTap HTML → Markdown for bio_md storage. */
export function editorHtmlToMarkdown(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<p></p>") return "";
  return turndown.turndown(trimmed).trim();
}
