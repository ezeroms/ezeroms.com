import "server-only";

import { loadTagCatalog } from "@/lib/workspace/tag-catalog";
import { orderedTagNames } from "@/lib/workspace/tags";

export async function listWorkspaceTags(): Promise<string[]> {
  const catalog = await loadTagCatalog();
  return orderedTagNames(catalog.tags, catalog.groups);
}
