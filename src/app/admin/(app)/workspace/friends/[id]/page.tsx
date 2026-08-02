import { notFound } from "next/navigation";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { FriendDetailForm } from "@/components/friends/FriendDetailForm";
import { Alert } from "@/components/ui/alert";
import { getSessionUser } from "@/lib/supabase/auth";
import { listActivities } from "@/lib/workspace/activities";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { getFriend } from "@/lib/workspace/friends";
import { friendDisplayName } from "@/types/friends";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceFriendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getSessionUser();
  const { id } = await params;

  if (!hasWorkspaceConfig()) {
    return (
      <AdminContent width="wide">
        <AdminPageHeader title="Friend" description="交友録" />
        <WorkspaceConfigNotice />
      </AdminContent>
    );
  }

  let loadError: string | null = null;
  let friend = null as Awaited<ReturnType<typeof getFriend>>;
  let activities = [] as Awaited<ReturnType<typeof listActivities>>;

  try {
    friend = await getFriend(id);
    if (friend && !friend.deleted_at) {
      activities = await listActivities({ friendId: id, limit: 100 });
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
  }

  if (!loadError && (!friend || friend.deleted_at)) {
    notFound();
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={friend ? friendDisplayName(friend) : "Friend"}
      />
      <WorkspaceConfigNotice />
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      {friend && !friend.deleted_at ? (
        <FriendDetailForm friend={friend} activities={activities} />
      ) : null}
    </AdminContent>
  );
}
