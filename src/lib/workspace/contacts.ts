import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import {
  contactHasIdentity,
  parseContactTags,
  type ContactAddress,
  type ContactEmployment,
  type ContactLink,
  type ContactPhone,
  type WorkspaceContact,
  type WorkspaceContactDetail,
} from "@/types/contacts";

/** contacts テーブルの標準カラム一覧（activities の embed でも共有） */
export const CONTACT_SELECT =
  "id, family_name, given_name, middle_name, family_name_kana, given_name_kana, middle_name_kana, family_name_en, given_name_en, middle_name_en, former_family_name, english_name, nickname, birthday, birthday_year_known, notes_md, is_friend, tags, created_at, updated_at, deleted_at";

const PHONE_SELECT =
  "id, contact_id, label, value, sort_order, created_at, updated_at";
const ADDRESS_SELECT =
  "id, contact_id, label, value, sort_order, created_at, updated_at";
const LINK_SELECT =
  "id, contact_id, label, url, sort_order, created_at, updated_at";
const EMPLOYMENT_SELECT =
  "id, contact_id, company_name, title, started_on, ended_on, is_current, notes, sort_order, created_at, updated_at";

export type ContactListFilter = {
  includeDeleted?: boolean;
  /** When true, only is_friend contacts. When false, only non-friends. Omit for all. */
  isFriend?: boolean;
  q?: string;
  tag?: string;
  limit?: number;
};

export type ContactWriteInput = {
  family_name?: string | null;
  given_name?: string | null;
  middle_name?: string | null;
  family_name_kana?: string | null;
  given_name_kana?: string | null;
  middle_name_kana?: string | null;
  family_name_en?: string | null;
  given_name_en?: string | null;
  middle_name_en?: string | null;
  former_family_name?: string | null;
  english_name?: string | null;
  nickname?: string | null;
  birthday?: string | null;
  birthday_year_known?: boolean;
  notes_md?: string | null;
  is_friend?: boolean;
  tags?: string[] | string | null;
};

export type ContactPhoneWrite = {
  id?: string;
  label?: string | null;
  value: string;
  sort_order?: number;
};

export type ContactAddressWrite = {
  id?: string;
  label?: string | null;
  value: string;
  sort_order?: number;
};

export type ContactLinkWrite = {
  id?: string;
  label?: string | null;
  url: string;
  sort_order?: number;
};

export type ContactEmploymentWrite = {
  id?: string;
  company_name: string;
  title?: string | null;
  started_on?: string | null;
  ended_on?: string | null;
  is_current?: boolean;
  notes?: string | null;
  sort_order?: number;
};

export type ContactChildrenWrite = {
  phones?: ContactPhoneWrite[];
  addresses?: ContactAddressWrite[];
  links?: ContactLinkWrite[];
  employments?: ContactEmploymentWrite[];
};

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t ? t : null;
}

function normalizeContact(row: WorkspaceContact): WorkspaceContact {
  return {
    ...row,
    is_friend: Boolean(row.is_friend),
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

function normalizeWrite(input: ContactWriteInput): Record<string, unknown> {
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
  if (input.former_family_name !== undefined)
    row.former_family_name = trimOrNull(input.former_family_name);
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
  if (input.is_friend !== undefined) row.is_friend = Boolean(input.is_friend);
  if (input.tags !== undefined) row.tags = parseContactTags(input.tags);
  return row;
}

export async function listContacts(
  filter: ContactListFilter = {},
): Promise<WorkspaceContact[]> {
  const limit = filter.limit ?? 200;
  let q = getWorkspaceAdmin()
    .from("contacts")
    .select(CONTACT_SELECT)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!filter.includeDeleted) {
    q = q.is("deleted_at", null);
  }
  if (filter.isFriend !== undefined) {
    q = q.eq("is_friend", filter.isFriend);
  }
  if (filter.tag) {
    q = q.contains("tags", [filter.tag]);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  let items = ((data ?? []) as WorkspaceContact[]).map(normalizeContact);
  const needle = filter.q?.trim().toLowerCase();
  if (needle) {
    items = items.filter((c) => {
      const hay = [
        c.family_name,
        c.given_name,
        c.middle_name,
        c.family_name_kana,
        c.given_name_kana,
        c.family_name_en,
        c.given_name_en,
        c.former_family_name,
        c.english_name,
        c.nickname,
        ...c.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }
  return items;
}

export async function getContact(id: string): Promise<WorkspaceContact | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("contacts")
    .select(CONTACT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeContact(data as WorkspaceContact) : null;
}

export async function listPhonesForContact(
  contactId: string,
): Promise<ContactPhone[]> {
  const { data, error } = await getWorkspaceAdmin()
    .from("contact_phones")
    .select(PHONE_SELECT)
    .eq("contact_id", contactId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContactPhone[];
}

export async function listAddressesForContact(
  contactId: string,
): Promise<ContactAddress[]> {
  const { data, error } = await getWorkspaceAdmin()
    .from("contact_addresses")
    .select(ADDRESS_SELECT)
    .eq("contact_id", contactId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContactAddress[];
}

export async function listLinksForContact(
  contactId: string,
): Promise<ContactLink[]> {
  const { data, error } = await getWorkspaceAdmin()
    .from("contact_links")
    .select(LINK_SELECT)
    .eq("contact_id", contactId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContactLink[];
}

export async function listEmploymentsForContact(
  contactId: string,
): Promise<ContactEmployment[]> {
  const { data, error } = await getWorkspaceAdmin()
    .from("contact_employments")
    .select(EMPLOYMENT_SELECT)
    .eq("contact_id", contactId)
    .order("is_current", { ascending: false })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContactEmployment[];
}

export async function getContactDetail(
  id: string,
): Promise<WorkspaceContactDetail | null> {
  const contact = await getContact(id);
  if (!contact) return null;
  const [phones, addresses, links, employments] = await Promise.all([
    listPhonesForContact(id),
    listAddressesForContact(id),
    listLinksForContact(id),
    listEmploymentsForContact(id),
  ]);
  return { ...contact, phones, addresses, links, employments };
}

/**
 * current employment company/title for list display.
 * contactId → { company_name, title } | null
 */
export async function listCurrentEmploymentsByContactIds(
  contactIds: string[],
): Promise<Map<string, Pick<ContactEmployment, "company_name" | "title">>> {
  const ids = [...new Set(contactIds)].filter(Boolean);
  const map = new Map<
    string,
    Pick<ContactEmployment, "company_name" | "title">
  >();
  if (ids.length === 0) return map;

  const { data, error } = await getWorkspaceAdmin()
    .from("contact_employments")
    .select("contact_id, company_name, title")
    .in("contact_id", ids)
    .eq("is_current", true);
  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    map.set(row.contact_id as string, {
      company_name: row.company_name as string,
      title: (row.title as string | null) ?? null,
    });
  }
  return map;
}

export async function createContact(
  input: ContactWriteInput,
  children: ContactChildrenWrite = {},
): Promise<WorkspaceContactDetail> {
  const row = normalizeWrite(input);
  if (
    !contactHasIdentity({
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
  if (row.is_friend === undefined) row.is_friend = false;
  if (row.tags === undefined) row.tags = [];

  const { data, error } = await getWorkspaceAdmin()
    .from("contacts")
    .insert(row)
    .select(CONTACT_SELECT)
    .single();
  if (error) throw new Error(error.message);
  const contact = normalizeContact(data as WorkspaceContact);
  await replaceContactChildren(contact.id, children);
  const detail = await getContactDetail(contact.id);
  if (!detail) throw new Error("Contact missing after create");
  return detail;
}

export async function updateContact(
  id: string,
  patch: ContactWriteInput,
  children?: ContactChildrenWrite,
): Promise<WorkspaceContactDetail> {
  const existing = await getContact(id);
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
  if (!contactHasIdentity(next)) {
    throw new Error(
      "family_name, given_name, english_name, or nickname is required",
    );
  }

  if (Object.keys(row).length > 0) {
    const { error } = await getWorkspaceAdmin()
      .from("contacts")
      .update(row)
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  if (children) {
    await replaceContactChildren(id, children);
  }

  const detail = await getContactDetail(id);
  if (!detail) throw new Error("Not found");
  return detail;
}

export async function softDeleteContact(
  id: string,
): Promise<WorkspaceContact> {
  const { data, error } = await getWorkspaceAdmin()
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select(CONTACT_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return normalizeContact(data as WorkspaceContact);
}

async function replaceContactChildren(
  contactId: string,
  children: ContactChildrenWrite,
): Promise<void> {
  if (children.phones !== undefined) {
    await replacePhones(contactId, children.phones);
  }
  if (children.addresses !== undefined) {
    await replaceAddresses(contactId, children.addresses);
  }
  if (children.links !== undefined) {
    await replaceLinks(contactId, children.links);
  }
  if (children.employments !== undefined) {
    await replaceEmployments(contactId, children.employments);
  }
}

async function replacePhones(
  contactId: string,
  phones: ContactPhoneWrite[],
): Promise<void> {
  const { error: delError } = await getWorkspaceAdmin()
    .from("contact_phones")
    .delete()
    .eq("contact_id", contactId);
  if (delError) throw new Error(delError.message);

  const rows = phones
    .map((p, i) => ({
      contact_id: contactId,
      label: trimOrNull(p.label),
      value: p.value.trim(),
      sort_order: p.sort_order ?? i,
    }))
    .filter((p) => p.value);
  if (rows.length === 0) return;

  const { error } = await getWorkspaceAdmin().from("contact_phones").insert(rows);
  if (error) throw new Error(error.message);
}

async function replaceAddresses(
  contactId: string,
  addresses: ContactAddressWrite[],
): Promise<void> {
  const { error: delError } = await getWorkspaceAdmin()
    .from("contact_addresses")
    .delete()
    .eq("contact_id", contactId);
  if (delError) throw new Error(delError.message);

  const rows = addresses
    .map((a, i) => ({
      contact_id: contactId,
      label: trimOrNull(a.label),
      value: a.value.trim(),
      sort_order: a.sort_order ?? i,
    }))
    .filter((a) => a.value);
  if (rows.length === 0) return;

  const { error } = await getWorkspaceAdmin()
    .from("contact_addresses")
    .insert(rows);
  if (error) throw new Error(error.message);
}

async function replaceLinks(
  contactId: string,
  links: ContactLinkWrite[],
): Promise<void> {
  const { error: delError } = await getWorkspaceAdmin()
    .from("contact_links")
    .delete()
    .eq("contact_id", contactId);
  if (delError) throw new Error(delError.message);

  const rows = links
    .map((l, i) => ({
      contact_id: contactId,
      label: trimOrNull(l.label),
      url: l.url.trim(),
      sort_order: l.sort_order ?? i,
    }))
    .filter((l) => l.url);
  if (rows.length === 0) return;

  const { error } = await getWorkspaceAdmin().from("contact_links").insert(rows);
  if (error) throw new Error(error.message);
}

async function replaceEmployments(
  contactId: string,
  employments: ContactEmploymentWrite[],
): Promise<void> {
  const { error: delError } = await getWorkspaceAdmin()
    .from("contact_employments")
    .delete()
    .eq("contact_id", contactId);
  if (delError) throw new Error(delError.message);

  const cleaned = employments
    .map((e, i) => ({
      contact_id: contactId,
      company_name: e.company_name.trim(),
      title: trimOrNull(e.title),
      started_on: e.started_on ? e.started_on.slice(0, 10) : null,
      ended_on: e.ended_on ? e.ended_on.slice(0, 10) : null,
      is_current: Boolean(e.is_current),
      notes: trimOrNull(e.notes),
      sort_order: e.sort_order ?? i,
    }))
    .filter((e) => e.company_name);

  // Enforce at most one is_current (last wins).
  let sawCurrent = false;
  for (let i = cleaned.length - 1; i >= 0; i -= 1) {
    if (cleaned[i].is_current) {
      if (sawCurrent) cleaned[i].is_current = false;
      else sawCurrent = true;
    }
  }

  if (cleaned.length === 0) return;

  const { error } = await getWorkspaceAdmin()
    .from("contact_employments")
    .insert(cleaned);
  if (error) throw new Error(error.message);
}
