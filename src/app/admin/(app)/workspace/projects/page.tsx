import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { ProjectsBoard } from "@/components/projects/ProjectsBoard";
import { Alert } from "@/components/ui/alert";
import { findAdminNavItem } from "@/lib/admin/nav";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { listProjects } from "@/lib/workspace/projects";

export const dynamic = "force-dynamic";

const navItem = findAdminNavItem("/admin/workspace/projects/")!;

export default async function AdminWorkspaceProjectsPage() {
  await getSessionUser();

  let loadError: string | null = null;
  let projects: Awaited<ReturnType<typeof listProjects>> = [];

  if (hasWorkspaceConfig()) {
    try {
      projects = await listProjects();
    } catch (e) {
      loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
    }
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={navItem.label}
        description={navItem.description}
      />
      {!hasWorkspaceConfig() ? <WorkspaceConfigNotice /> : null}
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      {hasWorkspaceConfig() && !loadError ? (
        <ProjectsBoard initialProjects={projects} />
      ) : null}
    </AdminContent>
  );
}