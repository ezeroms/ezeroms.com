import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { TagsManageBoard } from "@/components/workspace/TagsManageBoard";
import { Alert } from "@/components/ui/alert";
import { requireAdminPage } from "@/lib/supabase/auth";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { loadTagCatalog } from "@/lib/workspace/tag-catalog";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceTagsPage() {
  await requireAdminPage();

  let loadError: string | null = null;
  let groups: Awaited<ReturnType<typeof loadTagCatalog>>["groups"] = [];
  let tags: Awaited<ReturnType<typeof loadTagCatalog>>["tags"] = [];

  if (hasWorkspaceConfig()) {
    try {
      const catalog = await loadTagCatalog();
      groups = catalog.groups;
      tags = catalog.tags;
    } catch (e) {
      loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
    }
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title="Tags"
        description="Docs / Tasks で共有するタグのグループと並び順"
      />
      {!hasWorkspaceConfig() ? <WorkspaceConfigNotice /> : null}
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      {hasWorkspaceConfig() && !loadError ? (
        <TagsManageBoard initialGroups={groups} initialTags={tags} />
      ) : null}
    </AdminContent>
  );
}
