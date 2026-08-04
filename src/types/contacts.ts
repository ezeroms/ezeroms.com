export type ActivityTitleSource = "manual" | "calendar";

export type WorkspaceContact = {
  id: string;
  family_name: string | null;
  given_name: string | null;
  middle_name: string | null;
  family_name_kana: string | null;
  given_name_kana: string | null;
  middle_name_kana: string | null;
  family_name_en: string | null;
  given_name_en: string | null;
  middle_name_en: string | null;
  english_name: string | null;
  nickname: string | null;
  birthday: string | null;
  birthday_year_known: boolean;
  notes_md: string | null;
  is_friend: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ContactPhone = {
  id: string;
  contact_id: string;
  label: string | null;
  value: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ContactAddress = {
  id: string;
  contact_id: string;
  label: string | null;
  value: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ContactLink = {
  id: string;
  contact_id: string;
  label: string | null;
  url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ContactEmployment = {
  id: string;
  contact_id: string;
  company_name: string;
  title: string | null;
  started_on: string | null;
  ended_on: string | null;
  is_current: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** Contact with related child rows (detail view / nested write). */
export type WorkspaceContactDetail = WorkspaceContact & {
  phones: ContactPhone[];
  addresses: ContactAddress[];
  links: ContactLink[];
  employments: ContactEmployment[];
};

export type WorkspaceActivity = {
  id: string;
  title: string;
  title_source: ActivityTitleSource;
  occurred_at: string | null;
  ended_at: string | null;
  what_md: string | null;
  notes_md: string | null;
  location: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ActivityCalendarLink = {
  id: string;
  activity_id: string;
  google_calendar_id: string;
  google_event_id: string;
  sync_status: "linked" | "detached";
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Google event → Activity join returned with calendar events GET. */
export type CalendarActivityLink = {
  googleCalendarId: string;
  googleEventId: string;
  activityId: string;
  activityTitle: string;
  contactIds: string[];
  contactNames: string[];
};

export const ACTIVITY_TITLE_SOURCES: ActivityTitleSource[] = [
  "manual",
  "calendar",
];

export function isActivityTitleSource(v: unknown): v is ActivityTitleSource {
  return (
    typeof v === "string" &&
    ACTIVITY_TITLE_SOURCES.includes(v as ActivityTitleSource)
  );
}

function nonEmpty(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t ? t : null;
}

/** Japanese-style display: 姓 [ミドル] 名 */
export function contactDisplayName(
  contact: Pick<
    WorkspaceContact,
    | "family_name"
    | "given_name"
    | "middle_name"
    | "english_name"
    | "nickname"
  >,
): string {
  const parts = [
    nonEmpty(contact.family_name),
    nonEmpty(contact.middle_name),
    nonEmpty(contact.given_name),
  ].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(" ");
  return (
    nonEmpty(contact.english_name) ??
    nonEmpty(contact.nickname) ??
    "（無名）"
  );
}

export function contactHasIdentity(
  input: Pick<
    WorkspaceContact,
    "family_name" | "given_name" | "english_name" | "nickname"
  >,
): boolean {
  return Boolean(
    nonEmpty(input.family_name) ||
      nonEmpty(input.given_name) ||
      nonEmpty(input.english_name) ||
      nonEmpty(input.nickname),
  );
}

/** Parse comma / full-width comma / whitespace-separated tags. */
export function parseContactTags(
  raw: string | string[] | null | undefined,
): string[] {
  if (raw == null) return [];
  const parts = Array.isArray(raw) ? raw : raw.split(/[,、，]/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const t = p.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Alias used by Activities. */
export const parseActivityTags = parseContactTags;

export function formatContactTags(tags: string[]): string {
  return tags.join(", ");
}

export const formatActivityTags = formatContactTags;

/** 漢字の姓・名（ミドル含む）。なければ英語名など。 */
export function contactListName(
  contact: Pick<
    WorkspaceContact,
    | "family_name"
    | "given_name"
    | "middle_name"
    | "english_name"
    | "nickname"
  >,
): string {
  const parts = [
    nonEmpty(contact.family_name),
    nonEmpty(contact.middle_name),
    nonEmpty(contact.given_name),
  ].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(" ");
  return (
    nonEmpty(contact.english_name) ??
    nonEmpty(contact.nickname) ??
    "（無名）"
  );
}

/** 一覧用: 名前（ニックネーム） */
export function contactListNameWithNickname(
  contact: Pick<
    WorkspaceContact,
    | "family_name"
    | "given_name"
    | "middle_name"
    | "english_name"
    | "nickname"
  >,
): string {
  const name = contactListName(contact);
  const nick = nonEmpty(contact.nickname);
  if (!nick || name === nick) return name;
  return `${name}（${nick}）`;
}

/** カタカナ→ひらがな（五十音ソート用） */
export function toHiragana(input: string): string {
  return input.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

/** 五十音ソートキー（読み優先、なければ漢字名） */
export function contactSortKey(
  contact: Pick<
    WorkspaceContact,
    | "family_name_kana"
    | "given_name_kana"
    | "middle_name_kana"
    | "family_name"
    | "given_name"
    | "middle_name"
    | "english_name"
    | "nickname"
  >,
): string {
  const kana = [
    nonEmpty(contact.family_name_kana),
    nonEmpty(contact.middle_name_kana),
    nonEmpty(contact.given_name_kana),
  ]
    .filter(Boolean)
    .join("");
  if (kana) return toHiragana(kana).toLowerCase();
  return toHiragana(contactListName(contact)).toLowerCase();
}

export function compareContactsByKana(
  a: Parameters<typeof contactSortKey>[0],
  b: Parameters<typeof contactSortKey>[0],
): number {
  return contactSortKey(a).localeCompare(contactSortKey(b), "ja");
}

const SMALL_HIRAGANA: Record<string, string> = {
  ぁ: "あ",
  ぃ: "い",
  ぅ: "う",
  ぇ: "え",
  ぉ: "お",
  っ: "つ",
  ゃ: "や",
  ゅ: "ゆ",
  ょ: "よ",
  ゎ: "わ",
};

/**
 * 一覧セクション見出し用の先頭文字（読みの1文字目）。
 * 存在する読みだけ見出しにする前提で、呼び出し側でグルーピングする。
 */
export function contactSectionLabel(
  contact: Parameters<typeof contactSortKey>[0],
): string {
  const key = contactSortKey(contact).trim();
  if (!key) return "その他";

  let ch = toHiragana(key.charAt(0));
  ch = SMALL_HIRAGANA[ch] ?? ch;

  if (/^[ぁ-ん]$/.test(ch)) return ch;
  if (/^[a-z]$/i.test(ch)) return ch.toUpperCase();
  if (/^[0-9]$/.test(ch)) return ch;
  return "その他";
}

/** Birthday month (1–12) or null when unset / unparseable. */
export function contactBirthdayMonth(
  contact: Pick<WorkspaceContact, "birthday">,
): number | null {
  if (!contact.birthday) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(contact.birthday.slice(0, 10));
  if (!m) return null;
  const month = Number(m[2]);
  return month >= 1 && month <= 12 ? month : null;
}

/** Birthday day-of-month (1–31) or null. */
export function contactBirthdayDay(
  contact: Pick<WorkspaceContact, "birthday">,
): number | null {
  if (!contact.birthday) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(contact.birthday.slice(0, 10));
  if (!m) return null;
  const day = Number(m[3]);
  return day >= 1 && day <= 31 ? day : null;
}

/** Section heading like `1月` / `未設定`. */
export function monthSectionLabel(month: number | null): string {
  if (month == null || month < 1 || month > 12) return "未設定";
  return `${month}月`;
}

/** 誕生日表示。年不明時は月日のみ。年齢は年が正確なときだけ。 */
export function formatContactBirthday(
  contact: Pick<WorkspaceContact, "birthday" | "birthday_year_known">,
  now: Date = new Date(),
): string {
  if (!contact.birthday) return "";
  const raw = contact.birthday.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return raw;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const md = `${mm}/${dd}`;

  if (!contact.birthday_year_known) {
    return md;
  }

  const age = ageFromBirthday(year, month, day, now);
  return `${year}/${mm}/${dd}（${age}歳）`;
}

function ageFromBirthday(
  year: number,
  month: number,
  day: number,
  now: Date,
): number {
  let age = now.getFullYear() - year;
  const hadBirthday =
    now.getMonth() + 1 > month ||
    (now.getMonth() + 1 === month && now.getDate() >= day);
  if (!hadBirthday) age -= 1;
  return Math.max(0, age);
}

/**
 * 相対表記: n日前 / mヶ月とn日前 / y年mヶ月とn日前
 */
export function formatRelativeAgo(
  pastIso: string,
  now: Date = new Date(),
): string {
  const past = new Date(pastIso);
  if (Number.isNaN(past.getTime())) return "";

  const start = new Date(
    past.getFullYear(),
    past.getMonth(),
    past.getDate(),
  );
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (end.getTime() < start.getTime()) return "今日";

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLast = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonthLast.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years === 0 && months === 0) {
    if (days === 0) return "今日";
    if (days === 1) return "昨日";
    return `${days}日前`;
  }

  const head: string[] = [];
  if (years > 0) head.push(`${years}年`);
  if (months > 0) head.push(`${months}ヶ月`);

  if (days > 0) {
    return `${head.join("")}と${days}日前`;
  }
  if (years > 0 && months > 0) return `${years}年${months}ヶ月前`;
  if (years > 0) return `${years}年前`;
  return `${months}ヶ月前`;
}

/** 最終アクティビティ日 + （相対）。一覧の「最後の記録」列で使う。 */
export function formatLastActivityAt(
  occurredAt: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!occurredAt) return "";
  const absolute = formatActivityDate(occurredAt);
  if (!absolute) return "";
  const relative = formatRelativeAgo(occurredAt, now);
  return relative ? `${absolute}（${relative}）` : absolute;
}

/** Activity 一覧用の絶対日付（YYYY/MM/DD、ゼロ埋め） */
export function formatActivityDate(
  occurredAt: string | null | undefined,
): string {
  if (!occurredAt) return "";
  const d = new Date(occurredAt);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export function formatEmploymentLabel(
  employment: Pick<ContactEmployment, "company_name" | "title">,
): string {
  const company = employment.company_name.trim();
  const title = nonEmpty(employment.title);
  return title ? `${company} / ${title}` : company;
}

export function currentEmployment(
  employments: ContactEmployment[],
): ContactEmployment | null {
  return employments.find((e) => e.is_current) ?? null;
}
