import { AdminContent } from "@/components/admin/AdminContent";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import {
  DocsBoard,
  type DocsNavSelection,
} from "@/components/docs/DocsBoard";
import { Alert } from "@/components/ui/alert";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { listDocs } from "@/lib/workspace/docs";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceDocsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; doc?: string }>;
}) {
  await getSessionUser();
  const params = await searchParams;

  let loadError: string | null = null;
  let docs = [] as Awaited<ReturnType<typeof listDocs>>;

  if (hasWorkspaceConfig()) {
    try {
      docs = await listDocs({ limit: 500 });
    } catch (e) {
      loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
    }
  }

  const tag = params.tag?.trim() || "";
  const initialSelection: DocsNavSelection = tag
    ? { kind: "tag", tag }
    : { kind: "all" };
  const initialDocId = params.doc?.trim() || null;

  return (
    <AdminContent
      width="wide"
      className="absolute inset-0 mx-0 flex w-auto max-w-none flex-col overflow-hidden bg-background px-0 py-0"
    >
      {!hasWorkspaceConfig() ? (
        <div className="px-6 py-8">
          <WorkspaceConfigNotice />
        </div>
      ) : null}
      {loadError ? (
        <div className="px-6 py-8">
          <Alert variant="destructive">{loadError}</Alert>
        </div>
      ) : null}
      {hasWorkspaceConfig() && !loadError ? (
        <DocsBoard
          initialDocs={docs}
          initialSelection={initialSelection}
          initialDocId={initialDocId}
        />
      ) : null}
    </AdminContent>
  );
}
