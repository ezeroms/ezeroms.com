import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { FriendCreateButton } from "@/components/friends/FriendCreateButton";
import {
  FriendsListTable,
  type FriendsTableItem,
} from "@/components/friends/FriendsListTable";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { findAdminNavItem } from "@/lib/admin/nav";
import { getSessionUser } from "@/lib/supabase/auth";
import { listLastActivityByFriendIds } from "@/lib/workspace/activities";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { listFriends } from "@/lib/workspace/friends";
import { compareFriendsByKana } from "@/types/friends";

export const dynamic = "force-dynamic";

const navItem = findAdminNavItem("/admin/workspace/friends/")!;

export default async function AdminWorkspaceFriendsPage() {
  await getSessionUser();

  let loadError: string | null = null;
  let items: FriendsTableItem[] = [];

  if (hasWorkspaceConfig()) {
    try {
      const friends = await listFriends({ limit: 500 });
      friends.sort(compareFriendsByKana);
      const lastMap = await listLastActivityByFriendIds(
        friends.map((f) => f.id),
      );
      items = friends.map((friend) => {
        const last = lastMap.get(friend.id);
        return {
          friend,
          lastActivityAt: last?.occurredAt ?? null,
          lastActivityTitle: last?.title ?? null,
        };
      });
    } catch (e) {
      loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
    }
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={navItem.label}
        actions={hasWorkspaceConfig() ? <FriendCreateButton /> : null}
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
            <FriendsListTable items={items} />
          </CardContent>
        </Card>
      ) : null}
    </AdminContent>
  );
}
