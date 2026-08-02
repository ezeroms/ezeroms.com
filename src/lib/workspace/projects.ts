import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import type {
  ProjectStatus,
  WorkspaceProject,
} from "@/types/workspace";

const SELECT =
  "id, name, description, status, created_at, updated_at, archived_at";

export async function listProjects(opts?: {
  includeArchived?: boolean;
}): Promise<WorkspaceProject[]> {
  let q = getWorkspaceAdmin()
    .from("projects")
    .select(SELECT)
    .order("updated_at", { ascending: false });

  if (!opts?.includeArchived) {
    q = q.is("archived_at", null).neq("status", "archived");
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceProject[];
}

export async function getProject(
  id: string,
): Promise<WorkspaceProject | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("projects")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WorkspaceProject | null) ?? null;
}

export async function createProject(input: {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
}): Promise<WorkspaceProject> {
  const { data, error } = await getWorkspaceAdmin()
    .from("projects")
    .insert({
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "active",
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceProject;
}

export async function updateProject(
  id: string,
  patch: {
    name?: string;
    description?: string | null;
    status?: ProjectStatus;
  },
): Promise<WorkspaceProject> {
  const row: Record<string, unknown> = { ...patch };
  if (patch.status === "archived") {
    row.archived_at = new Date().toISOString();
  } else if (patch.status) {
    row.archived_at = null;
  }

  const { data, error } = await getWorkspaceAdmin()
    .from("projects")
    .update(row)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceProject;
}

export async function archiveProject(id: string): Promise<WorkspaceProject> {
  return updateProject(id, { status: "archived" });
}
