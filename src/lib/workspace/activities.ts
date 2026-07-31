import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import {
  compareFriendsByKana,
  friendDisplayName,
  friendListNameWithNickname,
  parseActivityTags,
  type ActivityTitleSource,
  type WorkspaceActivity,
  type WorkspaceFriend,
} from "@/types/friends";

const SELECT =
  "id, title, title_source, occurred_at, ended_at, what_md, notes_md, location, tags, created_at, updated_at, deleted_at";

export type ActivityListFilter = {
  friendId?: string;
  from?: string;
  to?: string;
  tag?: string;
  includeDeleted?: boolean;
  limit?: number;
};

export type ActivityWriteInput = {
  title: string;
  title_source?: ActivityTitleSource;
  occurred_at?: string | null;
  ended_at?: string | null;
  what_md?: string | null;
  notes_md?: string | null;
  location?: string | null;
  tags?: string[] | string | null;
};

export type ActivityWithFriends = WorkspaceActivity & {
  friends: WorkspaceFriend[];
};

export async function listActivities(
  filter: ActivityListFilter = {},
): Promise<WorkspaceActivity[]> {
  const limit = filter.limit ?? 100;
  let query = getWorkspaceAdmin()
    .from("activities")
    .select(SELECT)
    .order("occurred_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (!filter.includeDeleted) {
    query = query.is("deleted_at", null);
  }
  if (filter.from) {
    query = query.gte("occurred_at", filter.from);
  }
  if (filter.to) {
    query = query.lt("occurred_at", filter.to);
  }
  if (filter.tag) {
    query = query.contains("tags", [filter.tag]);
  }

  if (filter.friendId) {
    const { data: links, error: linkError } = await getWorkspaceAdmin()
      .from("activity_friends")
      .select("activity_id")
      .eq("friend_id", filter.friendId);
    if (linkError) throw new Error(linkError.message);
    const activityIds = (links ?? []).map((row) => row.activity_id as string);
    if (activityIds.length === 0) return [];
    query = query.in("id", activityIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as WorkspaceActivity[]).map(normalizeActivity);
}

export async function getActivity(
  id: string,
): Promise<WorkspaceActivity | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("activities")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeActivity(data as WorkspaceActivity) : null;
}

export async function getActivityWithFriends(
  id: string,
): Promise<ActivityWithFriends | null> {
  const activity = await getActivity(id);
  if (!activity) return null;
  const friends = await listFriendsForActivity(id);
  return { ...activity, friends };
}

function normalizeActivity(row: WorkspaceActivity): WorkspaceActivity {
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

function toRow(input: Partial<ActivityWriteInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title.trim();
  if (input.title_source !== undefined) row.title_source = input.title_source;
  if (input.occurred_at !== undefined) row.occurred_at = input.occurred_at;
  if (input.ended_at !== undefined) row.ended_at = input.ended_at;
  if (input.what_md !== undefined) row.what_md = input.what_md;
  if (input.notes_md !== undefined) row.notes_md = input.notes_md;
  if (input.location !== undefined) {
    row.location =
      input.location == null ? null : input.location.trim() || null;
  }
  if (input.tags !== undefined) {
    row.tags = parseActivityTags(input.tags);
  }
  return row;
}

export async function createActivity(
  input: ActivityWriteInput,
): Promise<WorkspaceActivity> {
  const title = input.title.trim();
  if (!title) throw new Error("title is required");

  const { data, error } = await getWorkspaceAdmin()
    .from("activities")
    .insert({
      title,
      title_source: input.title_source ?? "manual",
      occurred_at: input.occurred_at ?? null,
      ended_at: input.ended_at ?? null,
      what_md: input.what_md ?? null,
      notes_md: input.notes_md ?? null,
      location: input.location?.trim() || null,
      tags: parseActivityTags(input.tags),
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return normalizeActivity(data as WorkspaceActivity);
}

export async function updateActivity(
  id: string,
  patch: Partial<ActivityWriteInput> & { title_source?: ActivityTitleSource },
): Promise<WorkspaceActivity> {
  const existing = await getActivity(id);
  if (!existing) throw new Error("Not found");

  const row = toRow(patch);
  if (patch.title !== undefined && !String(row.title ?? "").trim()) {
    throw new Error("title is required");
  }
  // タイトルを手編集したら、明示指定がない限り title_source を manual に戻す
  if (patch.title !== undefined && patch.title_source === undefined) {
    row.title_source = "manual";
  }

  const { data, error } = await getWorkspaceAdmin()
    .from("activities")
    .update(row)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return normalizeActivity(data as WorkspaceActivity);
}

export async function softDeleteActivity(
  id: string,
): Promise<WorkspaceActivity> {
  const { data, error } = await getWorkspaceAdmin()
    .from("activities")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return normalizeActivity(data as WorkspaceActivity);
}

/**
 * friendId → 最新 Activity（未削除・occurred_at ありのみ）。
 */
export async function listLastActivityByFriendIds(
  friendIds: string[],
): Promise<Map<string, { occurredAt: string; title: string; activityId: string }>> {
  const ids = [...new Set(friendIds)].filter(Boolean);
  const map = new Map<
    string,
    { occurredAt: string; title: string; activityId: string }
  >();
  if (ids.length === 0) return map;

  const { data, error } = await getWorkspaceAdmin()
    .from("activity_friends")
    .select(
      "friend_id, activity:activities (id, title, occurred_at, deleted_at)",
    )
    .in("friend_id", ids);
  if (error) throw new Error(error.message);

  type Row = {
    friend_id: string;
    activity:
      | {
          id: string;
          title: string;
          occurred_at: string | null;
          deleted_at: string | null;
        }
      | {
          id: string;
          title: string;
          occurred_at: string | null;
          deleted_at: string | null;
        }[]
      | null;
  };

  for (const row of (data ?? []) as unknown as Row[]) {
    // PostgREST の埋め込みは単一オブジェクト or 配列になり得る
    const activity = Array.isArray(row.activity)
      ? row.activity[0]
      : row.activity;
    if (!activity || activity.deleted_at || !activity.occurred_at) continue;
    const previous = map.get(row.friend_id);
    if (!previous || activity.occurred_at > previous.occurredAt) {
      map.set(row.friend_id, {
        occurredAt: activity.occurred_at,
        title: activity.title,
        activityId: activity.id,
      });
    }
  }
  return map;
}

/**
 * activityId → 未削除友達の表示名一覧（五十音順）。
 */
export async function listFriendNamesByActivityIds(
  activityIds: string[],
): Promise<Map<string, string[]>> {
  const ids = [...new Set(activityIds)].filter(Boolean);
  const map = new Map<string, string[]>();
  if (ids.length === 0) return map;

  const { data, error } = await getWorkspaceAdmin()
    .from("activity_friends")
    .select(
      "activity_id, friend:friends (id, family_name, given_name, middle_name, family_name_kana, given_name_kana, middle_name_kana, english_name, nickname, deleted_at)",
    )
    .in("activity_id", ids);
  if (error) throw new Error(error.message);

  type FriendLite = Pick<
    WorkspaceFriend,
    | "id"
    | "family_name"
    | "given_name"
    | "middle_name"
    | "family_name_kana"
    | "given_name_kana"
    | "middle_name_kana"
    | "english_name"
    | "nickname"
    | "deleted_at"
  >;

  type Row = {
    activity_id: string;
    friend: FriendLite | FriendLite[] | null;
  };

  const buckets = new Map<string, FriendLite[]>();
  for (const row of (data ?? []) as unknown as Row[]) {
    const friend = Array.isArray(row.friend) ? row.friend[0] : row.friend;
    if (!friend || friend.deleted_at) continue;
    const list = buckets.get(row.activity_id) ?? [];
    list.push(friend);
    buckets.set(row.activity_id, list);
  }

  for (const [activityId, friends] of buckets) {
    friends.sort(compareFriendsByKana);
    map.set(
      activityId,
      friends.map((f) => friendListNameWithNickname(f)),
    );
  }
  return map;
}

export async function listFriendsForActivity(
  activityId: string,
): Promise<WorkspaceFriend[]> {
  const { data, error } = await getWorkspaceAdmin()
    .from("activity_friends")
    .select(
      "friend:friends (id, family_name, given_name, middle_name, family_name_kana, given_name_kana, middle_name_kana, family_name_en, given_name_en, middle_name_en, english_name, nickname, birthday, birthday_year_known, notes_md, created_at, updated_at, deleted_at)",
    )
    .eq("activity_id", activityId);
  if (error) throw new Error(error.message);

  type Row = {
    friend: WorkspaceFriend | WorkspaceFriend[] | null;
  };
  return ((data ?? []) as unknown as Row[])
    .map((r) => (Array.isArray(r.friend) ? r.friend[0] : r.friend))
    .filter((f): f is WorkspaceFriend => Boolean(f));
}

/** Replace the friend set for an activity. */
export async function setActivityFriends(
  activityId: string,
  friendIds: string[],
): Promise<WorkspaceFriend[]> {
  const unique = [...new Set(friendIds.filter(Boolean))];
  const { error: delError } = await getWorkspaceAdmin()
    .from("activity_friends")
    .delete()
    .eq("activity_id", activityId);
  if (delError) throw new Error(delError.message);

  if (unique.length > 0) {
    const { error: insError } = await getWorkspaceAdmin()
      .from("activity_friends")
      .insert(
        unique.map((friend_id) => ({
          activity_id: activityId,
          friend_id,
        })),
      );
    if (insError) throw new Error(insError.message);
  }
  return listFriendsForActivity(activityId);
}

export async function addFriendToActivity(
  activityId: string,
  friendId: string,
): Promise<void> {
  const { error } = await getWorkspaceAdmin()
    .from("activity_friends")
    .upsert(
      { activity_id: activityId, friend_id: friendId },
      { onConflict: "activity_id,friend_id" },
    );
  if (error) throw new Error(error.message);
}

export async function removeFriendFromActivity(
  activityId: string,
  friendId: string,
): Promise<void> {
  const { error } = await getWorkspaceAdmin()
    .from("activity_friends")
    .delete()
    .eq("activity_id", activityId)
    .eq("friend_id", friendId);
  if (error) throw new Error(error.message);
}

export { friendDisplayName };
