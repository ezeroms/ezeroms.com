import { AdminContent } from "@/components/admin/AdminContent";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import {
  TasksBoard,
  type TasksNavSelection,
} from "@/components/tasks/TasksBoard";
import { Alert } from "@/components/ui/alert";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { TASK_VIEWS, type TaskViewId } from "@/lib/workspace/labels";
import { listProjects } from "@/lib/workspace/projects";
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
    project?: string;
    task?: string;
  }>;
}) {
  await getSessionUser();
  const params = await searchParams;

  let loadError: string | null = null;
  let tasks = [] as Awaited<ReturnType<typeof listTasks>>;
  let projects = [] as Awaited<ReturnType<typeof listProjects>>;

  if (hasWorkspaceConfig()) {
    try {
      // スマートリスト件数・クライアント絞り込み用に一括取得
      [tasks, projects] = await Promise.all([
        listTasks({ view: "all", limit: 500 }),
        listProjects(),
      ]);
    } catch (e) {
      loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
    }
  }

  const projectId = params.project?.trim() || "";
  const projectExists = projects.some((project) => project.id === projectId);
  const initialSelection: TasksNavSelection =
    projectId && projectExists
      ? { kind: "project", projectId }
      : { kind: "view", view: parseView(params.view) };

  const initialTaskId = params.task?.trim() || null;

  return (
    <AdminContent
      width="wide"
      className="-mx-6 -my-8 flex min-h-0 flex-1 flex-col overflow-hidden px-0 py-0"
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
          projects={projects}
          initialSelection={initialSelection}
          initialTaskId={initialTaskId}
        />
      ) : null}
    </AdminContent>
  );
}
