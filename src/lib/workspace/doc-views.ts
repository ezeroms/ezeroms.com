import { parseDocTags, type WorkspaceDoc } from "@/types/workspace";

export type DocsNavSelection =
  | { kind: "all" }
  | { kind: "tag"; tag: string };

export function uniqueDocTags(docs: WorkspaceDoc[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const doc of docs) {
    for (const tag of parseDocTags(doc.tags)) {
      if (seen.has(tag)) continue;
      seen.add(tag);
      out.push(tag);
    }
  }
  return out.sort((a, b) => a.localeCompare(b, "ja"));
}

export function filterDocsForBoard(
  docs: WorkspaceDoc[],
  selection: DocsNavSelection,
): WorkspaceDoc[] {
  if (selection.kind === "all") return docs;
  return docs.filter((doc) => parseDocTags(doc.tags).includes(selection.tag));
}

export function countDocsForTag(docs: WorkspaceDoc[], tag: string): number {
  return docs.filter((doc) => parseDocTags(doc.tags).includes(tag)).length;
}

export function docsBoardSelectionTitle(selection: DocsNavSelection): string {
  return selection.kind === "all" ? "すべて" : selection.tag;
}

export function docExcerpt(markdown: string, max = 80): string {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~>#|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}
