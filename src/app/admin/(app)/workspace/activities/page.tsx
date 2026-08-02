import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { ActivityCreateButton } from "@/components/friends/ActivityCreateButton";
import {
  ActivitiesListTable,
  type ActivitiesTableItem,
} from "@/components/friends/ActivitiesListTable";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { findAdminNavItem } from "@/lib/admin/nav";
import { getSessionUser } from "@/lib/supabase/auth";
import {
  listActivities,
  listFriendNamesByActivityIds,
} from "@/lib/workspace/activities";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { listFriends } from "@/lib/workspace/friends";
import type { WorkspaceFriend } from "@/types/friends";

export const dynamic = "force-dynamic";

const navItem = findAdminNavItem("/admin/workspace/activities/")!;

export default async function AdminWorkspaceActivitiesPage() {
  await getSessionUser();

  let loadError: string | null = null;
  let items: ActivitiesTableItem[] = [];
  let friends: WorkspaceFriend[] = [];

  if (hasWorkspaceConfig()) {
    try {
      const [activities, friendList] = await Promise.all([
        listActivities({ limit: 200 }),
        listFriends({ limit: 500 }),
      ]);
      friends = friendList;
      const friendNames = await listFriendNamesByActivityIds(
        activities.map((a) => a.id),
      );
      items = activities.map((activity) => ({
        activity,
        friendNames: friendNames.get(activity.id) ?? [],
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
            <ActivityCreateButton friends={friends} />
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
