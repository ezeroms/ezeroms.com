import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import { CONTACT_SELECT } from "@/lib/workspace/contacts";
import {
  compareContactsByKana,
  contactDisplayName,
  contactListNameWithNickname,
  parseActivityTags,
  type ActivityTitleSource,
  type WorkspaceActivity,
  type WorkspaceContact,
} from "@/types/contacts";

const SELECT =
  "id, title, title_source, occurred_at, ended_at, what_md, notes_md, location, tags, created_at, updated_at, deleted_at";

export type ActivityListFilter = {
  contactId?: string;
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

export type ActivityWithContacts = WorkspaceActivity & {
  contacts: WorkspaceContact[];
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

  if (filter.contactId) {
    const { data: links, error: linkError } = await getWorkspaceAdmin()
      .from("activity_contacts")
      .select("activity_id")
      .eq("contact_id", filter.contactId);
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

export async function getActivityWithContacts(
  id: string,
): Promise<ActivityWithContacts | null> {
  const activity = await getActivity(id);
  if (!activity) return null;
  const contacts = await listContactsForActivity(id);
  return { ...activity, contacts };
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
 * contactId → 最新 Activity（未削除・occurred_at ありのみ）。
 */
export async function listLastActivityByContactIds(
  contactIds: string[],
): Promise<Map<string, { occurredAt: string; title: string; activityId: string }>> {
  const ids = [...new Set(contactIds)].filter(Boolean);
  const map = new Map<
    string,
    { occurredAt: string; title: string; activityId: string }
  >();
  if (ids.length === 0) return map;

  const { data, error } = await getWorkspaceAdmin()
    .from("activity_contacts")
    .select(
      "contact_id, activity:activities (id, title, occurred_at, deleted_at)",
    )
    .in("contact_id", ids);
  if (error) throw new Error(error.message);

  type Row = {
    contact_id: string;
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
    const activity = Array.isArray(row.activity)
      ? row.activity[0]
      : row.activity;
    if (!activity || activity.deleted_at || !activity.occurred_at) continue;
    const previous = map.get(row.contact_id);
    if (!previous || activity.occurred_at > previous.occurredAt) {
      map.set(row.contact_id, {
        occurredAt: activity.occurred_at,
        title: activity.title,
        activityId: activity.id,
      });
    }
  }
  return map;
}

/**
 * activityId → 未削除コンタクトの表示名一覧（五十音順）。
 */
export async function listContactNamesByActivityIds(
  activityIds: string[],
): Promise<Map<string, string[]>> {
  const ids = [...new Set(activityIds)].filter(Boolean);
  const map = new Map<string, string[]>();
  if (ids.length === 0) return map;

  const { data, error } = await getWorkspaceAdmin()
    .from("activity_contacts")
    .select(
      `activity_id, contact:contacts (id, family_name, given_name, middle_name, family_name_kana, given_name_kana, middle_name_kana, english_name, nickname, deleted_at)`,
    )
    .in("activity_id", ids);
  if (error) throw new Error(error.message);

  type ContactLite = Pick<
    WorkspaceContact,
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
    contact: ContactLite | ContactLite[] | null;
  };

  const buckets = new Map<string, ContactLite[]>();
  for (const row of (data ?? []) as unknown as Row[]) {
    const contact = Array.isArray(row.contact) ? row.contact[0] : row.contact;
    if (!contact || contact.deleted_at) continue;
    const list = buckets.get(row.activity_id) ?? [];
    list.push(contact);
    buckets.set(row.activity_id, list);
  }

  for (const [activityId, contacts] of buckets) {
    contacts.sort(compareContactsByKana);
    map.set(
      activityId,
      contacts.map((c) => contactListNameWithNickname(c)),
    );
  }
  return map;
}

export async function listContactsForActivity(
  activityId: string,
): Promise<WorkspaceContact[]> {
  const { data, error } = await getWorkspaceAdmin()
    .from("activity_contacts")
    .select(`contact:contacts (${CONTACT_SELECT})`)
    .eq("activity_id", activityId);
  if (error) throw new Error(error.message);

  type Row = {
    contact: WorkspaceContact | WorkspaceContact[] | null;
  };
  return ((data ?? []) as unknown as Row[])
    .map((r) => (Array.isArray(r.contact) ? r.contact[0] : r.contact))
    .filter((c): c is WorkspaceContact => Boolean(c))
    .map((c) => ({
      ...c,
      is_friend: Boolean(c.is_friend),
      tags: Array.isArray(c.tags) ? c.tags : [],
    }));
}

/** Replace the contact set for an activity. */
export async function setActivityContacts(
  activityId: string,
  contactIds: string[],
): Promise<WorkspaceContact[]> {
  const unique = [...new Set(contactIds.filter(Boolean))];
  const { error: delError } = await getWorkspaceAdmin()
    .from("activity_contacts")
    .delete()
    .eq("activity_id", activityId);
  if (delError) throw new Error(delError.message);

  if (unique.length > 0) {
    const { error: insError } = await getWorkspaceAdmin()
      .from("activity_contacts")
      .insert(
        unique.map((contact_id) => ({
          activity_id: activityId,
          contact_id,
        })),
      );
    if (insError) throw new Error(insError.message);
  }
  return listContactsForActivity(activityId);
}

export async function addContactToActivity(
  activityId: string,
  contactId: string,
): Promise<void> {
  const { error } = await getWorkspaceAdmin()
    .from("activity_contacts")
    .upsert(
      { activity_id: activityId, contact_id: contactId },
      { onConflict: "activity_id,contact_id" },
    );
  if (error) throw new Error(error.message);
}

export async function removeContactFromActivity(
  activityId: string,
  contactId: string,
): Promise<void> {
  const { error } = await getWorkspaceAdmin()
    .from("activity_contacts")
    .delete()
    .eq("activity_id", activityId)
    .eq("contact_id", contactId);
  if (error) throw new Error(error.message);
}

export { contactDisplayName };
