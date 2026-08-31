import { itemHasTag, uniqueTagsFromItems } from "@/lib/workspace/tags";
import type { WorkspaceDoc } from "@/types/workspace";

export type DocsNavSelection =
  | { kind: "all" }
  | { kind: "tag"; tag: string };

export function uniqueDocTags(docs: WorkspaceDoc[]): string[] {
  return uniqueTagsFromItems(docs);
}

export function filterDocsForBoard(
  docs: WorkspaceDoc[],
  selection: DocsNavSelection,
): WorkspaceDoc[] {
  if (selection.kind === "all") return docs;
  return docs.filter((doc) => itemHasTag(doc, selection.tag));
}

export function countDocsForTag(docs: WorkspaceDoc[], tag: string): number {
  return docs.filter((doc) => itemHasTag(doc, tag)).length;
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
