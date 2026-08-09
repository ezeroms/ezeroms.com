import {
  formatContactTags,
  type WorkspaceContactDetail,
} from "@/types/contacts";

/** 電話・住所など「ラベル + 値」の子行 */
export type ContactLabeledValue = { label: string; value: string };

/** リンク行 */
export type ContactLinkRow = { label: string; url: string };

/** 職歴行（編集フォーム用の文字列表現） */
export type ContactEmploymentRow = {
  company_name: string;
  title: string;
  started_on: string;
  ended_on: string;
  is_current: boolean;
  notes: string;
};

/**
 * モーダルのクリック編集などで使うローカル編集状態。
 * API の null は空文字に揃え、日付は YYYY-MM-DD だけ残す。
 */
export type ContactEditorState = {
  family_name: string;
  given_name: string;
  middle_name: string;
  family_name_kana: string;
  given_name_kana: string;
  middle_name_kana: string;
  family_name_en: string;
  given_name_en: string;
  middle_name_en: string;
  former_family_name: string;
  english_name: string;
  nickname: string;
  birthday: string;
  birthday_year_known: boolean;
  notes_md: string;
  is_friend: boolean;
  tags: string;
  phones: ContactLabeledValue[];
  addresses: ContactLabeledValue[];
  links: ContactLinkRow[];
  employments: ContactEmploymentRow[];
};

/** API の ContactDetail → 編集用ローカル状態 */
export function contactToEditorState(
  contact: WorkspaceContactDetail,
): ContactEditorState {
  return {
    family_name: contact.family_name ?? "",
    given_name: contact.given_name ?? "",
    middle_name: contact.middle_name ?? "",
    family_name_kana: contact.family_name_kana ?? "",
    given_name_kana: contact.given_name_kana ?? "",
    middle_name_kana: contact.middle_name_kana ?? "",
    family_name_en: contact.family_name_en ?? "",
    given_name_en: contact.given_name_en ?? "",
    middle_name_en: contact.middle_name_en ?? "",
    former_family_name: contact.former_family_name ?? "",
    english_name: contact.english_name ?? "",
    nickname: contact.nickname ?? "",
    birthday: contact.birthday?.slice(0, 10) ?? "",
    birthday_year_known: contact.birthday_year_known,
    notes_md: contact.notes_md ?? "",
    is_friend: contact.is_friend,
    tags: formatContactTags(contact.tags),
    phones: contact.phones.map((phone) => ({
      label: phone.label ?? "",
      value: phone.value,
    })),
    addresses: contact.addresses.map((address) => ({
      label: address.label ?? "",
      value: address.value,
    })),
    links: contact.links.map((link) => ({
      label: link.label ?? "",
      url: link.url,
    })),
    employments: contact.employments.map((employment) => ({
      company_name: employment.company_name,
      title: employment.title ?? "",
      started_on: employment.started_on?.slice(0, 10) ?? "",
      ended_on: employment.ended_on?.slice(0, 10) ?? "",
      is_current: employment.is_current,
      notes: employment.notes ?? "",
    })),
  };
}

/**
 * 電話・住所・リンク・職歴を PATCH 用ペイロードに変換する。
 * 空行は送らず、職歴の任意項目は null に落とす。
 */
export function buildContactChildrenPayload(
  state: Pick<
    ContactEditorState,
    "phones" | "addresses" | "links" | "employments"
  >,
) {
  return {
    phones: state.phones.filter((phone) => phone.value.trim()),
    addresses: state.addresses.filter((address) => address.value.trim()),
    links: state.links.filter((link) => link.url.trim()),
    employments: state.employments
      .filter((employment) => employment.company_name.trim())
      .map((employment) => ({
        company_name: employment.company_name,
        title: employment.title || null,
        started_on: employment.started_on || null,
        ended_on: employment.ended_on || null,
        is_current: employment.is_current,
        notes: employment.notes || null,
      })),
  };
}

/** 姓・ミドル・名を表示用に空白区切りでつなぐ */
export function joinContactNameParts(
  family: string,
  middle: string,
  given: string,
): string {
  return [family, middle, given].map((part) => part.trim()).filter(Boolean).join(" ");
}

/**
 * クリック編集の「姓 名」1行入力を部品に戻す。
 * - 1語 → 姓のみ
 * - 2語 → 姓・名
 * - 3語以上 → 先頭＝姓・末尾＝名・間はミドル
 */
export function parseJoinedContactName(raw: string): {
  family: string;
  middle: string;
  given: string;
} {
  const parts = raw
    .trim()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return { family: "", middle: "", given: "" };
  if (parts.length === 1) return { family: parts[0], middle: "", given: "" };
  if (parts.length === 2) {
    return { family: parts[0], middle: "", given: parts[1] };
  }
  return {
    family: parts[0],
    middle: parts.slice(1, -1).join(" "),
    given: parts[parts.length - 1],
  };
}
