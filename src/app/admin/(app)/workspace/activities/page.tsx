import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { ActivityCreateButton } from "@/components/contacts/ActivityCreateButton";
import {
  ActivitiesListTable,
  type ActivitiesTableItem,
} from "@/components/contacts/ActivitiesListTable";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { findAdminNavItem } from "@/lib/admin/nav";
import { getSessionUser } from "@/lib/supabase/auth";
import {
  listActivities,
  listContactNamesByActivityIds,
} from "@/lib/workspace/activities";
import { listContacts } from "@/lib/workspace/contacts";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import type { WorkspaceContact } from "@/types/contacts";

export const dynamic = "force-dynamic";

const navItem = findAdminNavItem("/admin/workspace/activities/")!;

export default async function AdminWorkspaceActivitiesPage() {
  await getSessionUser();

  let loadError: string | null = null;
  let items: ActivitiesTableItem[] = [];
  let contacts: WorkspaceContact[] = [];

  if (hasWorkspaceConfig()) {
    try {
      const [activities, contactList] = await Promise.all([
        listActivities({ limit: 200 }),
        listContacts({ limit: 500 }),
      ]);
      contacts = contactList;
      const contactNames = await listContactNamesByActivityIds(
        activities.map((a) => a.id),
      );
      items = activities.map((activity) => ({
        activity,
        contactNames: contactNames.get(activity.id) ?? [],
      }));
    } catch (e) {
      loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
    }
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={navItem.label}
        actions={
          hasWorkspaceConfig() ? (
            <ActivityCreateButton contacts={contacts} />
          ) : null
        }
      />
      <WorkspaceConfigNotice />
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      {hasWorkspaceConfig() && !loadError ? (
        <Card className="overflow-hidden">
          <CardContent className="overflow-x-auto p-0">
            <ActivitiesListTable items={items} />
          </CardContent>
        </Card>
      ) : null}
    </AdminContent>
  );
}
