import {
  parseWorkspaceTags,
  type WorkspaceDoc,
  type WorkspaceTask,
  type WorkspaceTag,
  type WorkspaceTagGroup,
} from "@/types/workspace";

export function itemHasTag(
  item: { tags?: string[] | null },
  tag: string,
): boolean {
  return parseWorkspaceTags(item.tags).includes(tag);
}

export function uniqueTagsFromItems(
  items: Array<{ tags?: string[] | null }>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    for (const tag of parseWorkspaceTags(item.tags)) {
      if (seen.has(tag)) continue;
      seen.add(tag);
      out.push(tag);
    }
  }
  return out.sort((a, b) => a.localeCompare(b, "ja"));
}

/** Docs と Tasks で共有するタグ語彙。 */
export function uniqueWorkspaceTags(
  docs: WorkspaceDoc[],
  tasks: WorkspaceTask[],
): string[] {
  return uniqueTagsFromItems([...docs, ...tasks]);
}

export function isArchivedDoc(doc: WorkspaceDoc): boolean {
  return doc.status === "archived" || doc.archived_at != null;
}

export function isArchivedTask(task: WorkspaceTask): boolean {
  return task.status === "archived" || task.archived_at != null;
}

/**
 * サイドバー用。アイテムが1件以上あるタグだけ（アーカイブ含む）。
 */
export function sidebarTagsForItems(
  items: Array<{ tags?: string[] | null }>,
): string[] {
  return uniqueTagsFromItems(items);
}

export type TagNavSection = {
  id: string | null;
  label: string | null;
  tags: string[];
};

/** 使用中のタグを、カタログのグループ／並び順で並べる。 */
export function groupTagsForNav(
  usedNames: string[],
  catalog: WorkspaceTag[] = [],
  groups: WorkspaceTagGroup[] = [],
): TagNavSection[] {
  const used = new Set(usedNames);
  const byName = new Map((catalog ?? []).map((tag) => [tag.name, tag]));
  const orderedGroups = [...(groups ?? [])].sort(
    (a, b) =>
      a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ja"),
  );

  const sections: TagNavSection[] = [];
  for (const group of orderedGroups) {
    const tags = catalog
      .filter((tag) => tag.group_id === group.id && used.has(tag.name))
      .sort(
        (a, b) =>
          a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ja"),
      )
      .map((tag) => tag.name);
    if (tags.length) {
      sections.push({ id: group.id, label: group.name, tags });
    }
  }

  const ungroupedCatalog = catalog
    .filter((tag) => tag.group_id == null && used.has(tag.name))
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ja"),
    )
    .map((tag) => tag.name);
  const unknown = usedNames.filter((name) => !byName.has(name));
  const ungrouped = [...ungroupedCatalog, ...unknown];
  if (ungrouped.length) {
    sections.push({ id: null, label: null, tags: ungrouped });
  }
  return sections;
}

export function orderedTagNames(
  catalog: WorkspaceTag[] = [],
  groups: WorkspaceTagGroup[] = [],
): string[] {
  return groupTagsForNav(
    (catalog ?? []).map((tag) => tag.name),
    catalog,
    groups,
  ).flatMap((section) => section.tags);
}
