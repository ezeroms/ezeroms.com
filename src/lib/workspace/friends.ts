import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import {
  friendHasIdentity,
  type WorkspaceFriend,
} from "@/types/friends";

const SELECT =
  "id, family_name, given_name, middle_name, family_name_kana, given_name_kana, middle_name_kana, family_name_en, given_name_en, middle_name_en, english_name, nickname, birthday, birthday_year_known, notes_md, created_at, updated_at, deleted_at";

export type FriendListFilter = {
  includeDeleted?: boolean;
  q?: string;
  limit?: number;
};

export type FriendWriteInput = {
  family_name?: string | null;
  given_name?: string | null;
  middle_name?: string | null;
  family_name_kana?: string | null;
  given_name_kana?: string | null;
  middle_name_kana?: string | null;
  family_name_en?: string | null;
  given_name_en?: string | null;
  middle_name_en?: string | null;
  english_name?: string | null;
  nickname?: string | null;
  birthday?: string | null;
  birthday_year_known?: boolean;
  notes_md?: string | null;
};

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t ? t : null;
}

function normalizeWrite(input: FriendWriteInput): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.family_name !== undefined) row.family_name = trimOrNull(input.family_name);
  if (input.given_name !== undefined) row.given_name = trimOrNull(input.given_name);
  if (input.middle_name !== undefined) row.middle_name = trimOrNull(input.middle_name);
  if (input.family_name_kana !== undefined)
    row.family_name_kana = trimOrNull(input.family_name_kana);
  if (input.given_name_kana !== undefined)
    row.given_name_kana = trimOrNull(input.given_name_kana);
  if (input.middle_name_kana !== undefined)
    row.middle_name_kana = trimOrNull(input.middle_name_kana);
  if (input.family_name_en !== undefined)
    row.family_name_en = trimOrNull(input.family_name_en);
  if (input.given_name_en !== undefined)
    row.given_name_en = trimOrNull(input.given_name_en);
  if (input.middle_name_en !== undefined)
    row.middle_name_en = trimOrNull(input.middle_name_en);
  if (input.english_name !== undefined)
    row.english_name = trimOrNull(input.english_name);
  if (input.nickname !== undefined) row.nickname = trimOrNull(input.nickname);
  if (input.birthday !== undefined) {
    row.birthday = input.birthday ? input.birthday.slice(0, 10) : null;
  }
  if (input.birthday_year_known !== undefined) {
    row.birthday_year_known = Boolean(input.birthday_year_known);
  }
  if (input.notes_md !== undefined) row.notes_md = input.notes_md;
  return row;
}

export async function listFriends(
  filter: FriendListFilter = {},
): Promise<WorkspaceFriend[]> {
  const limit = filter.limit ?? 200;
  let q = getWorkspaceAdmin()
    .from("friends")
    .select(SELECT)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!filter.includeDeleted) {
    q = q.is("deleted_at", null);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  let items = (data ?? []) as WorkspaceFriend[];
  const needle = filter.q?.trim().toLowerCase();
  if (needle) {
    items = items.filter((f) => {
      const hay = [
        f.family_name,
        f.given_name,
        f.middle_name,
        f.family_name_kana,
        f.given_name_kana,
        f.family_name_en,
        f.given_name_en,
        f.english_name,
        f.nickname,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }
  return items;
}

export async function getFriend(id: string): Promise<WorkspaceFriend | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("friends")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WorkspaceFriend | null) ?? null;
}

export async function createFriend(
  input: FriendWriteInput,
): Promise<WorkspaceFriend> {
  const row = normalizeWrite(input);
  if (
    !friendHasIdentity({
      family_name: (row.family_name as string | null) ?? null,
      given_name: (row.given_name as string | null) ?? null,
      english_name: (row.english_name as string | null) ?? null,
      nickname: (row.nickname as string | null) ?? null,
    })
  ) {
    throw new Error(
      "family_name, given_name, english_name, or nickname is required",
    );
  }
  if (row.birthday_year_known === undefined) {
    row.birthday_year_known = false;
  }

  const { data, error } = await getWorkspaceAdmin()
    .from("friends")
    .insert(row)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceFriend;
}

export async function updateFriend(
  id: string,
  patch: FriendWriteInput,
): Promise<WorkspaceFriend> {
  const existing = await getFriend(id);
  if (!existing) throw new Error("Not found");

  const row = normalizeWrite(patch);
  const next = {
    family_name:
      row.family_name !== undefined
        ? (row.family_name as string | null)
        : existing.family_name,
    given_name:
      row.given_name !== undefined
        ? (row.given_name as string | null)
        : existing.given_name,
    english_name:
      row.english_name !== undefined
        ? (row.english_name as string | null)
        : existing.english_name,
    nickname:
      row.nickname !== undefined
        ? (row.nickname as string | null)
        : existing.nickname,
  };
  if (!friendHasIdentity(next)) {
    throw new Error(
      "family_name, given_name, english_name, or nickname is required",
    );
  }

  const { data, error } = await getWorkspaceAdmin()
    .from("friends")
    .update(row)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceFriend;
}

export async function softDeleteFriend(id: string): Promise<WorkspaceFriend> {
  const { data, error } = await getWorkspaceAdmin()
    .from("friends")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceFriend;
}
