import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import type {
  ItemLinkRelation,
  ItemLinkType,
  WorkspaceItemLink,
} from "@/types/workspace";

const SELECT =
  "id, from_type, from_id, to_type, to_id, relation, created_at";

export async function listLinks(opts: {
  type?: ItemLinkType;
  id?: string;
  limit?: number;
}): Promise<WorkspaceItemLink[]> {
  const limit = opts.limit ?? 100;
  const db = getWorkspaceAdmin();

  if (opts.type && opts.id) {
    const [fromRes, toRes] = await Promise.all([
      db
        .from("item_links")
        .select(SELECT)
        .eq("from_type", opts.type)
        .eq("from_id", opts.id)
        .order("created_at", { ascending: false })
        .limit(limit),
      db
        .from("item_links")
        .select(SELECT)
        .eq("to_type", opts.type)
        .eq("to_id", opts.id)
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);
    if (fromRes.error) throw new Error(fromRes.error.message);
    if (toRes.error) throw new Error(toRes.error.message);
    const map = new Map<string, WorkspaceItemLink>();
    for (const row of [
      ...((fromRes.data ?? []) as WorkspaceItemLink[]),
      ...((toRes.data ?? []) as WorkspaceItemLink[]),
    ]) {
      map.set(row.id, row);
    }
    return [...map.values()].sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1,
    );
  }

  const { data, error } = await db
    .from("item_links")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceItemLink[];
}

export async function createLink(input: {
  from_type: ItemLinkType;
  from_id: string;
  to_type: ItemLinkType;
  to_id: string;
  relation?: ItemLinkRelation;
}): Promise<WorkspaceItemLink> {
  const { data, error } = await getWorkspaceAdmin()
    .from("item_links")
    .insert({
      from_type: input.from_type,
      from_id: input.from_id,
      to_type: input.to_type,
      to_id: input.to_id,
      relation: input.relation ?? "related",
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceItemLink;
}

export async function deleteLink(id: string): Promise<void> {
  const { error } = await getWorkspaceAdmin()
    .from("item_links")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
