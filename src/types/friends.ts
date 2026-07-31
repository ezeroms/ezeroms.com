export type ActivityTitleSource = "manual" | "calendar";

export type WorkspaceFriend = {
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
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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
  friendIds: string[];
  friendNames: string[];
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
export function friendDisplayName(
  friend: Pick<
    WorkspaceFriend,
    | "family_name"
    | "given_name"
    | "middle_name"
    | "english_name"
    | "nickname"
  >,
): string {
  const parts = [
    nonEmpty(friend.family_name),
    nonEmpty(friend.middle_name),
    nonEmpty(friend.given_name),
  ].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(" ");
  return (
    nonEmpty(friend.english_name) ??
    nonEmpty(friend.nickname) ??
    "（無名）"
  );
}

export function friendHasIdentity(
  input: Pick<
    WorkspaceFriend,
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
export function parseActivityTags(raw: string | string[] | null | undefined): string[] {
  if (raw == null) return [];
  const parts = Array.isArray(raw)
    ? raw
    : raw.split(/[,、，]/);
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

export function formatActivityTags(tags: string[]): string {
  return tags.join(", ");
}

/** 漢字の姓・名（ミドル含む）。なければ英語名など。 */
export function friendListName(
  friend: Pick<
    WorkspaceFriend,
    | "family_name"
    | "given_name"
    | "middle_name"
    | "english_name"
    | "nickname"
  >,
): string {
  const parts = [
    nonEmpty(friend.family_name),
    nonEmpty(friend.middle_name),
    nonEmpty(friend.given_name),
  ].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(" ");
  return (
    nonEmpty(friend.english_name) ??
    nonEmpty(friend.nickname) ??
    "（無名）"
  );
}

/** 一覧用: 名前（ニックネーム） */
export function friendListNameWithNickname(
  friend: Pick<
    WorkspaceFriend,
    | "family_name"
    | "given_name"
    | "middle_name"
    | "english_name"
    | "nickname"
  >,
): string {
  const name = friendListName(friend);
  const nick = nonEmpty(friend.nickname);
  // 表示名がニックネームそのもののときは重複しない
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
export function friendSortKey(
  friend: Pick<
    WorkspaceFriend,
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
    nonEmpty(friend.family_name_kana),
    nonEmpty(friend.middle_name_kana),
    nonEmpty(friend.given_name_kana),
  ]
    .filter(Boolean)
    .join("");
  if (kana) return toHiragana(kana).toLowerCase();
  return toHiragana(friendListName(friend)).toLowerCase();
}

export function compareFriendsByKana(
  a: Parameters<typeof friendSortKey>[0],
  b: Parameters<typeof friendSortKey>[0],
): number {
  return friendSortKey(a).localeCompare(friendSortKey(b), "ja");
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
export function friendSectionLabel(
  friend: Parameters<typeof friendSortKey>[0],
): string {
  const key = friendSortKey(friend).trim();
  if (!key) return "その他";

  let ch = toHiragana(key.charAt(0));
  ch = SMALL_HIRAGANA[ch] ?? ch;

  if (/^[ぁ-ん]$/.test(ch)) return ch;
  if (/^[a-z]$/i.test(ch)) return ch.toUpperCase();
  if (/^[0-9]$/.test(ch)) return ch;
  return "その他";
}

/** Birthday month (1–12) or null when unset / unparseable. */
export function friendBirthdayMonth(
  friend: Pick<WorkspaceFriend, "birthday">,
): number | null {
  if (!friend.birthday) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(friend.birthday.slice(0, 10));
  if (!m) return null;
  const month = Number(m[2]);
  return month >= 1 && month <= 12 ? month : null;
}

/** Birthday day-of-month (1–31) or null. */
export function friendBirthdayDay(
  friend: Pick<WorkspaceFriend, "birthday">,
): number | null {
  if (!friend.birthday) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(friend.birthday.slice(0, 10));
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
export function formatFriendBirthday(
  friend: Pick<WorkspaceFriend, "birthday" | "birthday_year_known">,
  now: Date = new Date(),
): string {
  if (!friend.birthday) return "";
  const raw = friend.birthday.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return raw;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const md = `${mm}/${dd}`;

  if (!friend.birthday_year_known) {
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

/** 最終アクティビティ日 + （相対）。Friends 一覧の「最後に遊んだ日」列で使う。 */
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
