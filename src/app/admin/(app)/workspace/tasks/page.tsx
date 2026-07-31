import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { Alert } from "@/components/ui/alert";
import { findAdminNavItem } from "@/lib/admin/nav";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { listProjects } from "@/lib/workspace/projects";
import { listTasks } from "@/lib/workspace/tasks";
import { TASK_VIEWS, type TaskViewId } from "@/lib/workspace/labels";

export const dynamic = "force-dynamic";

const navItem = findAdminNavItem("/admin/workspace/tasks/")!;

function parseView(raw: string | undefined): TaskViewId {
  const found = TASK_VIEWS.find((v) => v.id === raw);
  return found?.id ?? "inbox";
}

export default async function AdminWorkspaceTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await getSessionUser();
  const sp = await searchParams;
  const view = parseView(sp.view);

  let loadError: string | null = null;
  let tasks = [] as Awaited<ReturnType<typeof listTasks>>;
  let projects = [] as Awaited<ReturnType<typeof listProjects>>;

  if (hasWorkspaceConfig()) {
    try {
      [tasks, projects] = await Promise.all([
        listTasks({ view, limit: 200 }),
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
        <TasksBoard
          initialTasks={tasks}
          projects={projects}
          initialView={view}
        />
      ) : null}
    </AdminContent>
  );
}
