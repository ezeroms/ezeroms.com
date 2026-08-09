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
  /** 旧姓（現在の姓とは別に保持） */
  former_family_name: string | null;
  /**
   * イングリッシュネーム（通称の英語名）。
   * family_name_en など「英語表記」（正式なローマ字姓名）とは別フィールド。
   */
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

/** 漢字の姓・名（ミドル含む）。なければ英語名など。contactDisplayName と同じ。 */
export const contactListName = contactDisplayName;

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

/**
 * DB の birthday（YYYY-MM-DD）を年・月・日に分解する。
 * 形式が違う／空のときは null。
 */
export function parseBirthdayYmd(
  birthday: string | null | undefined,
): { year: number; month: number; day: number } | null {
  if (!birthday) return null;
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday.slice(0, 10));
  if (!matched) return null;
  return {
    year: Number(matched[1]),
    month: Number(matched[2]),
    day: Number(matched[3]),
  };
}

/** Birthday month (1–12) or null when unset / unparseable. */
export function contactBirthdayMonth(
  contact: Pick<WorkspaceContact, "birthday">,
): number | null {
  const parts = parseBirthdayYmd(contact.birthday);
  if (!parts) return null;
  return parts.month >= 1 && parts.month <= 12 ? parts.month : null;
}

/** Birthday day-of-month (1–31) or null. */
export function contactBirthdayDay(
  contact: Pick<WorkspaceContact, "birthday">,
): number | null {
  const parts = parseBirthdayYmd(contact.birthday);
  if (!parts) return null;
  return parts.day >= 1 && parts.day <= 31 ? parts.day : null;
}

/** Section heading like `1月` / `未設定`. */
export function monthSectionLabel(month: number | null): string {
  if (month == null || month < 1 || month > 12) return "未設定";
  return `${month}月`;
}

/**
 * 年不明の誕生日を PostgreSQL `date` に入れるときのダミー年（sentinel）。
 * UI では年を空欄にし、この値は表示・年齢計算に使わない。
 */
export const BIRTHDAY_UNKNOWN_YEAR = 1;

export type BirthdayInputParts = {
  /** 空なら年不明 */
  year: string;
  month: string;
  day: string;
};

/** DB の date + year_known を、年任意の入力パーツへ。 */
export function birthdayToInputParts(
  birthday: string | null | undefined,
  yearKnown: boolean,
): BirthdayInputParts {
  const parts = parseBirthdayYmd(birthday);
  if (!parts) return { year: "", month: "", day: "" };
  return {
    year: yearKnown ? String(parts.year).padStart(4, "0") : "",
    month: String(parts.month).padStart(2, "0"),
    day: String(parts.day).padStart(2, "0"),
  };
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const dt = new Date(year, month - 1, day);
  return (
    dt.getFullYear() === year &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day
  );
}

/**
 * 年／月／日入力を DB 用にシリアライズ。
 * 年空欄 + 月日あり → sentinel 年 + birthday_year_known=false。
 */
export function inputPartsToBirthday(parts: BirthdayInputParts): {
  birthday: string | null;
  birthday_year_known: boolean;
  error?: string;
} {
  const yearRaw = parts.year.trim();
  const monthRaw = parts.month.trim();
  const dayRaw = parts.day.trim();

  if (!yearRaw && !monthRaw && !dayRaw) {
    return { birthday: null, birthday_year_known: false };
  }

  if (!monthRaw || !dayRaw) {
    return {
      birthday: null,
      birthday_year_known: false,
      error: "月と日を入力してください",
    };
  }

  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return {
      birthday: null,
      birthday_year_known: false,
      error: "月は 1–12 で入力してください",
    };
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return {
      birthday: null,
      birthday_year_known: false,
      error: "日は 1–31 で入力してください",
    };
  }

  const yearKnown = yearRaw.length > 0;
  let year = BIRTHDAY_UNKNOWN_YEAR;
  if (yearKnown) {
    year = Number(yearRaw);
    if (!Number.isInteger(year) || year < 1000 || year > 2100) {
      return {
        birthday: null,
        birthday_year_known: false,
        error: "年は西暦4桁で入力してください",
      };
    }
  }

  // 年不明時はうるう年で 2/29 の妥当性だけ見る
  const checkYear = yearKnown ? year : 2020;
  if (!isValidCalendarDate(checkYear, month, day)) {
    return {
      birthday: null,
      birthday_year_known: false,
      error: "存在しない日付です",
    };
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return {
    birthday: `${String(year).padStart(4, "0")}-${mm}-${dd}`,
    birthday_year_known: yearKnown,
  };
}

/** 誕生日表示。年不明時は月日のみ。年齢は年があるときだけ。 */
export function formatContactBirthday(
  contact: Pick<WorkspaceContact, "birthday" | "birthday_year_known">,
  now: Date = new Date(),
): string {
  if (!contact.birthday) return "";
  const parts = parseBirthdayYmd(contact.birthday);
  if (!parts) return contact.birthday.slice(0, 10);

  const { year, month, day } = parts;
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
