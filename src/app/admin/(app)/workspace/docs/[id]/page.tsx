import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { DocDetailForm } from "@/components/docs/DocDetailForm";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { getDoc } from "@/lib/workspace/docs";
import { listLinks } from "@/lib/workspace/links";
import { listProjects } from "@/lib/workspace/projects";
import { getTask, listTasks } from "@/lib/workspace/tasks";
import type { WorkspaceTask } from "@/types/workspace";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminWorkspaceDocDetailPage({
  params,
}: PageProps) {
  await getSessionUser();
  const { id } = await params;

  if (!hasWorkspaceConfig()) {
    return (
      <AdminContent>
        <AdminPageHeader title="Doc" />
        <WorkspaceConfigNotice />
      </AdminContent>
    );
  }

  let doc: Awaited<ReturnType<typeof getDoc>> = null;
  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  let links: Awaited<ReturnType<typeof listLinks>> = [];
  let allTasks: Awaited<ReturnType<typeof listTasks>> = [];
  let loadError: string | null = null;

  try {
    [doc, projects, links, allTasks] = await Promise.all([
      getDoc(id),
      listProjects(),
      listLinks({ type: "doc", id }),
      listTasks({ view: "all", limit: 100 }),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
  }

  if (loadError) {
    return (
      <AdminContent>
        <AdminPageHeader title="Doc" />
        <Alert variant="destructive">{loadError}</Alert>
      </AdminContent>
    );
  }

  if (!doc) notFound();

  const linkedTaskIds = links
    .map((l) => {
      if (l.from_type === "task") return l.from_id;
      if (l.to_type === "task") return l.to_id;
      return null;
    })
    .filter((x): x is string => Boolean(x));

  const linkedTasks: WorkspaceTask[] = [];
  for (const taskId of linkedTaskIds) {
    const cached = allTasks.find((t) => t.id === taskId);
    if (cached) {
      linkedTasks.push(cached);
      continue;
    }
    const task = await getTask(taskId);
    if (task) linkedTasks.push(task);
  }

  return (
    <AdminContent>
      <AdminPageHeader
        title={doc.title}
        description="Doc の編集・Project・関連 Tasks"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/workspace/docs/">一覧</Link>
          </Button>
        }
      />
      <DocDetailForm
        doc={doc}
        projects={projects}
        links={links}
        linkedTasks={linkedTasks}
        allTasks={allTasks}
      />
    </AdminContent>
  );
}
