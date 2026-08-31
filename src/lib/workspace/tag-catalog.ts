import "server-only";

import { uniqueWorkspaceTags } from "@/lib/workspace/tags";
import { listDocs, updateDoc } from "@/lib/workspace/docs";
import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import { listTasks, updateTask } from "@/lib/workspace/tasks";
import {
  parseWorkspaceTags,
  type WorkspaceTag,
  type WorkspaceTagGroup,
} from "@/types/workspace";

const GROUP_SELECT = "id, name, sort_order, created_at, updated_at";
const TAG_SELECT = "id, name, group_id, sort_order, created_at, updated_at";

export type TagCatalog = {
  groups: WorkspaceTagGroup[];
  tags: WorkspaceTag[];
};

function asGroups(rows: unknown): WorkspaceTagGroup[] {
  return (rows ?? []) as WorkspaceTagGroup[];
}

function asTags(rows: unknown): WorkspaceTag[] {
  return (rows ?? []) as WorkspaceTag[];
}

export async function listTagGroups(): Promise<WorkspaceTagGroup[]> {
  const { data, error } = await getWorkspaceAdmin()
    .from("workspace_tag_groups")
    .select(GROUP_SELECT)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return asGroups(data);
}

export async function listTagRows(): Promise<WorkspaceTag[]> {
  const { data, error } = await getWorkspaceAdmin()
    .from("workspace_tags")
    .select(TAG_SELECT)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return asTags(data);
}

async function nextSortOrder(
  table: "workspace_tag_groups" | "workspace_tags",
  groupId?: string | null,
): Promise<number> {
  let q = getWorkspaceAdmin()
    .from(table)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  if (table === "workspace_tags") {
    q = groupId
      ? q.eq("group_id", groupId)
      : q.is("group_id", null);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const top = (data?.[0] as { sort_order?: number } | undefined)?.sort_order;
  return (top ?? -1) + 1;
}

export async function syncTagsFromUsage(): Promise<void> {
  const [docs, tasks, existing] = await Promise.all([
    listDocs({ limit: 500, includeArchived: true }),
    listTasks({ view: "all", limit: 500, includeArchived: true }),
    listTagRows(),
  ]);
  const have = new Set(existing.map((tag) => tag.name));
  const missing = uniqueWorkspaceTags(docs, tasks).filter(
    (name) => !have.has(name),
  );
  if (missing.length === 0) return;

  let order = await nextSortOrder("workspace_tags", null);
  const rows = missing.map((name) => {
    const row = { name, group_id: null, sort_order: order };
    order += 1;
    return row;
  });
  const { error } = await getWorkspaceAdmin()
    .from("workspace_tags")
    .insert(rows);
  if (error) throw new Error(error.message);
}

export async function loadTagCatalog(): Promise<TagCatalog> {
  await syncTagsFromUsage();
  const [groups, tags] = await Promise.all([listTagGroups(), listTagRows()]);
  return { groups, tags };
}

export async function createTagGroup(name: string): Promise<WorkspaceTagGroup> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("name is required");
  const sort_order = await nextSortOrder("workspace_tag_groups");
  const { data, error } = await getWorkspaceAdmin()
    .from("workspace_tag_groups")
    .insert({ name: trimmed, sort_order })
    .select(GROUP_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceTagGroup;
}

export async function updateTagGroup(
  id: string,
  patch: { name?: string; sort_order?: number },
): Promise<WorkspaceTagGroup> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new Error("name is required");
    row.name = name;
  }
  if (patch.sort_order !== undefined) row.sort_order = patch.sort_order;
  const { data, error } = await getWorkspaceAdmin()
    .from("workspace_tag_groups")
    .update(row)
    .eq("id", id)
    .select(GROUP_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceTagGroup;
}

export async function deleteTagGroup(id: string): Promise<void> {
  const { error } = await getWorkspaceAdmin()
    .from("workspace_tag_groups")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createTag(input: {
  name: string;
  group_id?: string | null;
}): Promise<WorkspaceTag> {
  const name = parseWorkspaceTags([input.name])[0];
  if (!name) throw new Error("name is required");
  const group_id = input.group_id || null;
  const sort_order = await nextSortOrder("workspace_tags", group_id);
  const { data, error } = await getWorkspaceAdmin()
    .from("workspace_tags")
    .insert({ name, group_id, sort_order })
    .select(TAG_SELECT)
    .single();
  if (error) {
    if (error.message.toLowerCase().includes("unique")) {
      throw new Error("同じ名前のタグがすでにあります");
    }
    throw new Error(error.message);
  }
  return data as WorkspaceTag;
}

async function replaceTagOnItems(from: string, to: string | null): Promise<void> {
  const [docs, tasks] = await Promise.all([
    listDocs({ tag: from, includeArchived: true, limit: 500 }),
    listTasks({ tag: from, includeArchived: true, view: "all", limit: 500 }),
  ]);
  for (const doc of docs) {
    const next = parseWorkspaceTags(doc.tags)
      .map((tag) => (tag === from ? to : tag))
      .filter((tag): tag is string => Boolean(tag));
    await updateDoc(doc.id, { tags: parseWorkspaceTags(next) });
  }
  for (const task of tasks) {
    const next = parseWorkspaceTags(task.tags)
      .map((tag) => (tag === from ? to : tag))
      .filter((tag): tag is string => Boolean(tag));
    await updateTask(task.id, { tags: parseWorkspaceTags(next) });
  }
}

export async function updateTag(
  id: string,
  patch: {
    name?: string;
    group_id?: string | null;
    sort_order?: number;
  },
): Promise<WorkspaceTag> {
  const existing = await getTag(id);
  if (!existing) throw new Error("Not found");

  const row: Record<string, unknown> = {};
  let renamedTo: string | null = null;
  if (patch.name !== undefined) {
    const name = parseWorkspaceTags([patch.name])[0];
    if (!name) throw new Error("name is required");
    row.name = name;
    if (name !== existing.name) renamedTo = name;
  }
  if (patch.group_id !== undefined) {
    row.group_id = patch.group_id || null;
    if ((patch.group_id || null) !== existing.group_id) {
      row.sort_order = await nextSortOrder(
        "workspace_tags",
        patch.group_id || null,
      );
    }
  }
  if (patch.sort_order !== undefined) row.sort_order = patch.sort_order;

  const { data, error } = await getWorkspaceAdmin()
    .from("workspace_tags")
    .update(row)
    .eq("id", id)
    .select(TAG_SELECT)
    .single();
  if (error) {
    if (error.message.toLowerCase().includes("unique")) {
      throw new Error("同じ名前のタグがすでにあります");
    }
    throw new Error(error.message);
  }
  const saved = data as WorkspaceTag;
  if (renamedTo) {
    await replaceTagOnItems(existing.name, renamedTo);
  }
  return saved;
}

export async function getTag(id: string): Promise<WorkspaceTag | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("workspace_tags")
    .select(TAG_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WorkspaceTag | null) ?? null;
}

export async function getTagGroup(
  id: string,
): Promise<WorkspaceTagGroup | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("workspace_tag_groups")
    .select(GROUP_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WorkspaceTagGroup | null) ?? null;
}

export async function deleteTag(id: string): Promise<void> {
  const existing = await getTag(id);
  if (!existing) throw new Error("Not found");
  await replaceTagOnItems(existing.name, null);
  const { error } = await getWorkspaceAdmin()
    .from("workspace_tags")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

async function compactOrders(
  table: "workspace_tag_groups" | "workspace_tags",
  ids: string[],
): Promise<void> {
  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await getWorkspaceAdmin()
      .from(table)
      .update({ sort_order: i })
      .eq("id", ids[i]);
    if (error) throw new Error(error.message);
  }
}

export async function moveTagGroup(
  id: string,
  direction: -1 | 1,
): Promise<TagCatalog> {
  const groups = await listTagGroups();
  const index = groups.findIndex((group) => group.id === id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= groups.length) {
    return loadTagCatalog();
  }
  const ids = groups.map((group) => group.id);
  const swap = ids[nextIndex];
  ids[nextIndex] = ids[index];
  ids[index] = swap;
  await compactOrders("workspace_tag_groups", ids);
  return loadTagCatalog();
}

export async function moveTag(
  id: string,
  direction: -1 | 1,
): Promise<TagCatalog> {
  const tags = await listTagRows();
  const current = tags.find((tag) => tag.id === id);
  if (!current) throw new Error("Not found");
  const siblings = tags.filter((tag) => tag.group_id === current.group_id);
  const index = siblings.findIndex((tag) => tag.id === id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= siblings.length) {
    return loadTagCatalog();
  }
  const ids = siblings.map((tag) => tag.id);
  const swap = ids[nextIndex];
  ids[nextIndex] = ids[index];
  ids[index] = swap;
  await compactOrders("workspace_tags", ids);
  return loadTagCatalog();
}
