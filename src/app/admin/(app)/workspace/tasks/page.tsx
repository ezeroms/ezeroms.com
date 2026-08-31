import { AdminContent } from "@/components/admin/AdminContent";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import {
  TasksBoard,
  type TasksNavSelection,
} from "@/components/tasks/TasksBoard";
import { Alert } from "@/components/ui/alert";
import { requireAdminPage } from "@/lib/supabase/auth";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { listDocs } from "@/lib/workspace/docs";
import { TASK_VIEWS, type TaskViewId } from "@/lib/workspace/labels";
import { loadTagCatalog } from "@/lib/workspace/tag-catalog";
import { listTasks } from "@/lib/workspace/tasks";

export const dynamic = "force-dynamic";

function parseView(raw: string | undefined): TaskViewId {
  const found = TASK_VIEWS.find((view) => view.id === raw);
  return found?.id ?? "inbox";
}

export default async function AdminWorkspaceTasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    tag?: string;
    task?: string;
  }>;
}) {
  await requireAdminPage();
  const params = await searchParams;

  let loadError: string | null = null;
  let tasks = [] as Awaited<ReturnType<typeof listTasks>>;
  let docs = [] as Awaited<ReturnType<typeof listDocs>>;
  let tagGroups = [] as Awaited<ReturnType<typeof loadTagCatalog>>["groups"];
  let catalogTags = [] as Awaited<ReturnType<typeof loadTagCatalog>>["tags"];

  if (hasWorkspaceConfig()) {
    try {
      const catalog = await loadTagCatalog();
      tagGroups = catalog.groups;
      catalogTags = catalog.tags;
      [tasks, docs] = await Promise.all([
        listTasks({ view: "all", limit: 500, includeArchived: true }),
        listDocs({ limit: 500, includeArchived: true }),
      ]);
    } catch (e) {
      loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
    }
  }

  const tag = params.tag?.trim() || "";
  const initialSelection: TasksNavSelection = tag
    ? { kind: "tag", tag }
    : { kind: "view", view: parseView(params.view) };

  const initialTaskId = params.task?.trim() || null;

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
        <TasksBoard
          initialTasks={tasks}
          initialDocs={docs}
          initialTagGroups={tagGroups}
          initialCatalogTags={catalogTags}
          initialSelection={initialSelection}
          initialTaskId={initialTaskId}
        />
      ) : null}
    </AdminContent>
  );
}
