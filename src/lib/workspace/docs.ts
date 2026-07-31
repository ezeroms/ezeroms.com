import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import type { DocStatus, WorkspaceDoc } from "@/types/workspace";

const SELECT =
  "id, title, body_md, status, project_id, occurred_at, review_at, created_at, updated_at, archived_at";

export type DocListFilter = {
  status?: DocStatus;
  projectId?: string;
  q?: string;
  includeArchived?: boolean;
  limit?: number;
};

export async function listDocs(
  filter: DocListFilter = {},
): Promise<WorkspaceDoc[]> {
  const limit = filter.limit ?? 100;
  let q = getWorkspaceAdmin()
    .from("docs")
    .select(SELECT)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!filter.includeArchived) {
    q = q.is("archived_at", null).neq("status", "archived");
  }
  if (filter.status) {
    q = q.eq("status", filter.status);
  }
  if (filter.projectId) {
    q = q.eq("project_id", filter.projectId);
  }
  if (filter.q?.trim()) {
    const term = filter.q.trim().replace(/%/g, "\\%");
    q = q.or(`title.ilike.%${term}%,body_md.ilike.%${term}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceDoc[];
}

export async function getDoc(id: string): Promise<WorkspaceDoc | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("docs")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WorkspaceDoc | null) ?? null;
}

export type DocWriteInput = {
  title: string;
  body_md?: string;
  status?: DocStatus;
  project_id?: string | null;
  occurred_at?: string | null;
  review_at?: string | null;
};

export async function createDoc(input: DocWriteInput): Promise<WorkspaceDoc> {
  const status = input.status ?? "inbox";
  const { data, error } = await getWorkspaceAdmin()
    .from("docs")
    .insert({
      title: input.title,
      body_md: input.body_md ?? "",
      status,
      project_id: input.project_id ?? null,
      occurred_at: input.occurred_at ?? null,
      review_at: input.review_at ?? null,
      archived_at: status === "archived" ? new Date().toISOString() : null,
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceDoc;
}

export async function updateDoc(
  id: string,
  patch: Partial<DocWriteInput>,
): Promise<WorkspaceDoc> {
  const row: Record<string, unknown> = { ...patch };
  if (patch.status === "archived") {
    row.archived_at = new Date().toISOString();
  } else if (patch.status) {
    row.archived_at = null;
  }

  const { data, error } = await getWorkspaceAdmin()
    .from("docs")
    .update(row)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceDoc;
}

export async function archiveDoc(id: string): Promise<WorkspaceDoc> {
  return updateDoc(id, { status: "archived" });
}
