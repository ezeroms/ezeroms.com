import { notFound } from "next/navigation";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { ActivityDetailForm } from "@/components/friends/ActivityDetailForm";
import { Alert } from "@/components/ui/alert";
import { getSessionUser } from "@/lib/supabase/auth";
import { getActivityCalendarLink } from "@/lib/workspace/activity-calendar-links";
import { getActivityWithFriends } from "@/lib/workspace/activities";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { listFriends } from "@/lib/workspace/friends";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getSessionUser();
  const { id } = await params;

  if (!hasWorkspaceConfig()) {
    return (
      <AdminContent width="wide">
        <AdminPageHeader title="Activity" description="交友録" />
        <WorkspaceConfigNotice />
      </AdminContent>
    );
  }

  let loadError: string | null = null;
  let activity = null as Awaited<ReturnType<typeof getActivityWithFriends>>;
  let allFriends = [] as Awaited<ReturnType<typeof listFriends>>;
  let calendarLink = null as Awaited<
    ReturnType<typeof getActivityCalendarLink>
  >;

  try {
    [activity, allFriends, calendarLink] = await Promise.all([
      getActivityWithFriends(id),
      listFriends({ limit: 500 }),
      getActivityCalendarLink(id),
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
        description="メモと友達"
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
          friends={activity.friends}
          allFriends={allFriends}
          calendarLink={
            calendarLink
              ? {
                  google_calendar_id: calendarLink.google_calendar_id,
                  google_event_id: calendarLink.google_event_id,
                }
              : null
          }
        />
      ) : null}
    </AdminContent>
  );
}
