import "server-only";

import {
  addFriendToActivity,
  createActivity,
  getActivity,
  listFriendsForActivity,
  setActivityFriends,
} from "@/lib/workspace/activities";
import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import {
  friendDisplayName,
  type ActivityCalendarLink,
  type CalendarActivityLink,
  type WorkspaceActivity,
} from "@/types/friends";

const LINK_SELECT =
  "id, activity_id, google_calendar_id, google_event_id, sync_status, last_synced_at, created_at, updated_at";

export async function getActivityLinkByGoogleEvent(
  googleCalendarId: string,
  googleEventId: string,
): Promise<ActivityCalendarLink | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("activity_calendar_links")
    .select(LINK_SELECT)
    .eq("google_calendar_id", googleCalendarId)
    .eq("google_event_id", googleEventId)
    .eq("sync_status", "linked")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ActivityCalendarLink | null) ?? null;
}

export async function getActivityCalendarLink(
  activityId: string,
): Promise<ActivityCalendarLink | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("activity_calendar_links")
    .select(LINK_SELECT)
    .eq("activity_id", activityId)
    .eq("sync_status", "linked")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ActivityCalendarLink | null) ?? null;
}

export async function upsertActivityCalendarLink(input: {
  activityId: string;
  googleCalendarId: string;
  googleEventId: string;
}): Promise<ActivityCalendarLink> {
  const { data, error } = await getWorkspaceAdmin()
    .from("activity_calendar_links")
    .upsert(
      {
        activity_id: input.activityId,
        google_calendar_id: input.googleCalendarId,
        google_event_id: input.googleEventId,
        sync_status: "linked",
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "google_calendar_id,google_event_id" },
    )
    .select(LINK_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as ActivityCalendarLink;
}

export async function listActivityLinksForEvents(
  googleEventIds: string[],
): Promise<CalendarActivityLink[]> {
  const ids = [...new Set(googleEventIds)].filter(Boolean);
  if (ids.length === 0) return [];

  const { data, error } = await getWorkspaceAdmin()
    .from("activity_calendar_links")
    .select(
      "google_calendar_id, google_event_id, activity:activities (id, title, deleted_at)",
    )
    .eq("sync_status", "linked")
    .in("google_event_id", ids);
  if (error) throw new Error(error.message);

  type Row = {
    google_calendar_id: string;
    google_event_id: string;
    activity:
      | { id: string; title: string; deleted_at: string | null }
      | { id: string; title: string; deleted_at: string | null }[]
      | null;
  };

  const rows = ((data ?? []) as unknown as Row[]).flatMap((row) => {
    const activity = Array.isArray(row.activity)
      ? row.activity[0]
      : row.activity;
    if (!activity || activity.deleted_at) return [];
    return [
      {
        googleCalendarId: row.google_calendar_id,
        googleEventId: row.google_event_id,
        activityId: activity.id,
        activityTitle: activity.title,
      },
    ];
  });

  const out: CalendarActivityLink[] = [];
  for (const row of rows) {
    const friends = await listFriendsForActivity(row.activityId);
    const active = friends.filter((f) => !f.deleted_at);
    out.push({
      ...row,
      friendIds: active.map((f) => f.id),
      friendNames: active.map(friendDisplayName),
    });
  }
  return out;
}

export type AttachFriendsToCalendarEventInput = {
  googleCalendarId: string;
  googleEventId: string;
  summary: string;
  start: string | null;
  end: string | null;
  location?: string | null;
  /** Full friend set for the activity (replaces existing). */
  friendIds: string[];
};

type EnsureActivityFromGoogleEventInput = {
  googleCalendarId: string;
  googleEventId: string;
  summary: string;
  start: string | null;
  end: string | null;
  location?: string | null;
};

/**
 * Google 予定に紐づく Activity を返す。
 * リンク未作成・紐づき Activity が削除済みなら新規作成し、リンクを張り直す。
 * （attach / addFriend で同じ手順を繰り返さないための共通処理）
 */
async function ensureActivityForGoogleEvent(
  input: EnsureActivityFromGoogleEventInput,
): Promise<WorkspaceActivity> {
  const existingLink = await getActivityLinkByGoogleEvent(
    input.googleCalendarId,
    input.googleEventId,
  );

  if (existingLink) {
    const found = await getActivity(existingLink.activity_id);
    if (found && !found.deleted_at) {
      return found;
    }
  }

  const created = await createActivity({
    title: input.summary.trim() || "（無題）",
    title_source: "calendar",
    occurred_at: input.start,
    ended_at: input.end,
    location: input.location ?? null,
  });
  await upsertActivityCalendarLink({
    activityId: created.id,
    googleCalendarId: input.googleCalendarId,
    googleEventId: input.googleEventId,
  });
  return created;
}

/**
 * Google 予定に対応する Activity を確保し、友達一覧を置き換える。
 * タイトル・時刻は初回作成時のみ Google からコピーする。
 */
export async function attachFriendsToCalendarEvent(
  input: AttachFriendsToCalendarEventInput,
): Promise<{ activity: WorkspaceActivity; friendIds: string[] }> {
  const activity = await ensureActivityForGoogleEvent(input);
  const friends = await setActivityFriends(activity.id, input.friendIds);
  return {
    activity,
    friendIds: friends.filter((f) => !f.deleted_at).map((f) => f.id),
  };
}

export async function addFriendToCalendarEvent(input: {
  googleCalendarId: string;
  googleEventId: string;
  summary: string;
  start: string | null;
  end: string | null;
  location?: string | null;
  friendId: string;
}): Promise<WorkspaceActivity> {
  const ensured = await ensureActivityForGoogleEvent(input);
  await addFriendToActivity(ensured.id, input.friendId);
  const activity = await getActivity(ensured.id);
  if (!activity) throw new Error("Activity missing after attach");
  return activity;
}
