import { notFound } from "next/navigation";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { ActivityDetailForm } from "@/components/contacts/ActivityDetailForm";
import { Alert } from "@/components/ui/alert";
import { requireAdminPage } from "@/lib/supabase/auth";
import { getActivityWithContacts } from "@/lib/workspace/activities";
import { listContacts } from "@/lib/workspace/contacts";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;

  if (!hasWorkspaceConfig()) {
    return (
      <AdminContent width="wide">
        <AdminPageHeader title="Activity" />
        <WorkspaceConfigNotice />
      </AdminContent>
    );
  }

  let loadError: string | null = null;
  let activity = null as Awaited<ReturnType<typeof getActivityWithContacts>>;
  let allContacts = [] as Awaited<ReturnType<typeof listContacts>>;

  try {
    [activity, allContacts] = await Promise.all([
      getActivityWithContacts(id),
      listContacts({ limit: 500 }),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
  }

  if (!loadError && (!activity || activity.deleted_at)) {
    notFound();
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={activity?.title ?? "Activity"}
      />
      <WorkspaceConfigNotice />
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      {activity && !activity.deleted_at ? (
        <ActivityDetailForm
          activity={activity}
          contacts={activity.contacts}
          allContacts={allContacts}
        />
      ) : null}
    </AdminContent>
  );
}
