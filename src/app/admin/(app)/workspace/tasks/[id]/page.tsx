import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { TaskDetailForm } from "@/components/tasks/TaskDetailForm";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { getDoc, listDocs } from "@/lib/workspace/docs";
import { listLinks } from "@/lib/workspace/links";
import { listProjects } from "@/lib/workspace/projects";
import { getTask } from "@/lib/workspace/tasks";
import type { WorkspaceDoc } from "@/types/workspace";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminWorkspaceTaskDetailPage({
  params,
}: PageProps) {
  await getSessionUser();
  const { id } = await params;

  if (!hasWorkspaceConfig()) {
    return (
      <AdminContent>
        <AdminPageHeader title="Task" />
        <WorkspaceConfigNotice />
      </AdminContent>
    );
  }

  let task: Awaited<ReturnType<typeof getTask>> = null;
  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  let links: Awaited<ReturnType<typeof listLinks>> = [];
  let allDocs: Awaited<ReturnType<typeof listDocs>> = [];
  let loadError: string | null = null;

  try {
    [task, projects, links, allDocs] = await Promise.all([
      getTask(id),
      listProjects(),
      listLinks({ type: "task", id }),
      listDocs({ limit: 100 }),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
  }

  if (loadError) {
    return (
      <AdminContent>
        <AdminPageHeader title="Task" />
        <Alert variant="destructive">{loadError}</Alert>
      </AdminContent>
    );
  }

  if (!task) notFound();

  const linkedDocIds = links
    .map((l) => {
      if (l.from_type === "doc") return l.from_id;
      if (l.to_type === "doc") return l.to_id;
      return null;
    })
    .filter((x): x is string => Boolean(x));

  const linkedDocs: WorkspaceDoc[] = [];
  for (const docId of linkedDocIds) {
    const cached = allDocs.find((d) => d.id === docId);
    if (cached) {
      linkedDocs.push(cached);
      continue;
    }
    const doc = await getDoc(docId);
    if (doc) linkedDocs.push(doc);
  }

  return (
    <AdminContent>
      <AdminPageHeader
        title={task.title}
        description="Task の詳細・Project・関連 Docs"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/workspace/tasks/">一覧</Link>
          </Button>
        }
      />
      <TaskDetailForm
        task={task}
        projects={projects}
        links={links}
        linkedDocs={linkedDocs}
        allDocs={allDocs}
      />
    </AdminContent>
  );
}
