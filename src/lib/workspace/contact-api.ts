import type {
  ContactChildrenWrite,
  ContactWriteInput,
} from "@/lib/workspace/contacts";
import { parseContactTags } from "@/types/contacts";

export function readContactBody(
  body: Record<string, unknown>,
): ContactWriteInput {
  const str = (k: string) =>
    body[k] === undefined
      ? undefined
      : body[k] == null
        ? null
        : String(body[k]);
  return {
    family_name: str("family_name"),
    given_name: str("given_name"),
    middle_name: str("middle_name"),
    family_name_kana: str("family_name_kana"),
    given_name_kana: str("given_name_kana"),
    middle_name_kana: str("middle_name_kana"),
    family_name_en: str("family_name_en"),
    given_name_en: str("given_name_en"),
    middle_name_en: str("middle_name_en"),
    english_name: str("english_name"),
    nickname: str("nickname"),
    birthday: str("birthday"),
    birthday_year_known:
      body.birthday_year_known === undefined
        ? undefined
        : Boolean(body.birthday_year_known),
    notes_md: str("notes_md"),
    is_friend:
      body.is_friend === undefined ? undefined : Boolean(body.is_friend),
    tags:
      body.tags === undefined
        ? undefined
        : parseContactTags(body.tags as string | string[] | null),
  };
}

export function readContactChildren(
  body: Record<string, unknown>,
): ContactChildrenWrite {
  const children: ContactChildrenWrite = {};
  if (Array.isArray(body.phones)) {
    children.phones = body.phones.map((p) => {
      const row = p as Record<string, unknown>;
      return {
        label: row.label == null ? null : String(row.label),
        value: String(row.value ?? ""),
        sort_order:
          typeof row.sort_order === "number" ? row.sort_order : undefined,
      };
    });
  }
  if (Array.isArray(body.addresses)) {
    children.addresses = body.addresses.map((a) => {
      const row = a as Record<string, unknown>;
      return {
        label: row.label == null ? null : String(row.label),
        value: String(row.value ?? ""),
        sort_order:
          typeof row.sort_order === "number" ? row.sort_order : undefined,
      };
    });
  }
  if (Array.isArray(body.links)) {
    children.links = body.links.map((l) => {
      const row = l as Record<string, unknown>;
      return {
        label: row.label == null ? null : String(row.label),
        url: String(row.url ?? ""),
        sort_order:
          typeof row.sort_order === "number" ? row.sort_order : undefined,
      };
    });
  }
  if (Array.isArray(body.employments)) {
    children.employments = body.employments.map((e) => {
      const row = e as Record<string, unknown>;
      return {
        company_name: String(row.company_name ?? ""),
        title: row.title == null ? null : String(row.title),
        started_on: row.started_on == null ? null : String(row.started_on),
        ended_on: row.ended_on == null ? null : String(row.ended_on),
        is_current: Boolean(row.is_current),
        notes: row.notes == null ? null : String(row.notes),
        sort_order:
          typeof row.sort_order === "number" ? row.sort_order : undefined,
      };
    });
  }
  return children;
}

export function hasContactChildrenPayload(
  body: Record<string, unknown>,
): boolean {
  return (
    Array.isArray(body.phones) ||
    Array.isArray(body.addresses) ||
    Array.isArray(body.links) ||
    Array.isArray(body.employments)
  );
}
