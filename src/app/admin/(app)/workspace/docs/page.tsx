import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { DocsBoard } from "@/components/docs/DocsBoard";
import { Alert } from "@/components/ui/alert";
import { findAdminNavItem } from "@/lib/admin/nav";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { listDocs } from "@/lib/workspace/docs";
import { listProjects } from "@/lib/workspace/projects";
import { isDocStatus } from "@/types/workspace";

export const dynamic = "force-dynamic";

const navItem = findAdminNavItem("/admin/workspace/docs/")!;

export default async function AdminWorkspaceDocsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await getSessionUser();
  const sp = await searchParams;
  const status =
    sp.status && isDocStatus(sp.status) ? sp.status : undefined;
  const q = sp.q?.trim() || undefined;

  let loadError: string | null = null;
  let docs = [] as Awaited<ReturnType<typeof listDocs>>;
  let projects = [] as Awaited<ReturnType<typeof listProjects>>;

  if (hasWorkspaceConfig()) {
    try {
      [docs, projects] = await Promise.all([
        listDocs({ status, q, limit: 200 }),
        listProjects(),
      ]);
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
      <WorkspaceConfigNotice />
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      {hasWorkspaceConfig() && !loadError ? (
        <DocsBoard
          initialDocs={docs}
          projects={projects}
          initialStatus={status ?? ""}
          initialQuery={q ?? ""}
        />
      ) : null}
    </AdminContent>
  );
}
