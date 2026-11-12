import {
  EN_GIVEN_FEMALE,
  EN_GIVEN_MALE,
  EN_SURNAMES,
  JA_GIVEN_FEMALE,
  JA_GIVEN_MALE,
  JA_SURNAMES,
} from "@/lib/tools/id-gen/names";
import { pickChar, pickOne, randomIndex, shuffle } from "@/lib/tools/id-gen/random";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
export const PASSWORD_SYMBOLS = "!@#$%^&*_-";
const EMAIL_BODY = `${LOWER}${DIGITS}`;
const EMAIL_LOCAL_LENGTH = 16;
export const DEFAULT_EMAIL_DOMAIN = "example.com";
const EMAIL_DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export const PASSWORD_LENGTH_MIN = 8;
export const PASSWORD_LENGTH_MAX = 64;
export const DEFAULT_PASSWORD_LENGTH = 24;

export type PasswordOptions = {
  length: number;
  symbols: boolean;
};

export function clampPasswordLength(length: number): number {
  if (!Number.isFinite(length)) return DEFAULT_PASSWORD_LENGTH;
  return Math.min(
    PASSWORD_LENGTH_MAX,
    Math.max(PASSWORD_LENGTH_MIN, Math.round(length)),
  );
}
export const DEFAULT_PASSWORD_SYMBOLS = true;

export type JaName = {
  family: string;
  given: string;
  familyKana: string;
  givenKana: string;
};

export type EnName = {
  first: string;
  last: string;
};

export const AGE_DECADES = [10, 20, 30, 40, 50, 60] as const;
export type AgeDecade = (typeof AGE_DECADES)[number];
export const DEFAULT_AGE_DECADES: readonly AgeDecade[] = [20, 30, 40];

export type Birthday = {
  /** YYYY/MM/DD in the local calendar. */
  date: string;
  age: number;
};

export type GeneratedAccount = {
  email: string;
  password: string;
  ja: JaName;
  en: EnName;
  birthday: Birthday | null;
};

/** A usable mail host, or null when the text is not a domain yet. */
export function normalizeEmailDomain(value: string): string | null {
  const domain = value.trim().toLowerCase().replace(/^@+/, "").replace(/\.+$/, "");
  if (!EMAIL_DOMAIN_PATTERN.test(domain)) return null;
  return domain;
}

export function randomEmail(domain = DEFAULT_EMAIL_DOMAIN): string {
  const host = normalizeEmailDomain(domain) ?? DEFAULT_EMAIL_DOMAIN;
  let local = pickChar(LOWER);
  for (let i = 1; i < EMAIL_LOCAL_LENGTH; i += 1) {
    local += pickChar(EMAIL_BODY);
  }
  return `${local}@${host}`;
}

/** Keep the local part and point it at another host. */
export function emailWithDomain(email: string, domain: string): string {
  const host = normalizeEmailDomain(domain) ?? DEFAULT_EMAIL_DOMAIN;
  const at = email.lastIndexOf("@");
  const local = at > 0 ? email.slice(0, at) : email;
  return `${local}@${host}`;
}

export function randomPassword(options: PasswordOptions): string {
  const length = clampPasswordLength(options.length);
  const classes = [UPPER, LOWER, DIGITS];
  if (options.symbols) classes.push(PASSWORD_SYMBOLS);
  if (length < classes.length) {
    throw new Error("Password length is too short for the required classes");
  }

  const pool = classes.join("");
  const chars = classes.map((alphabet) => pickChar(alphabet));
  while (chars.length < length) {
    chars.push(pickChar(pool));
  }
  return shuffle(chars).join("");
}

const RECENT_FULL = 64;
const RECENT_PART = 16;
const MAX_NAME_TRIES = 24;

const recentJaFull: string[] = [];
const recentJaFamily: string[] = [];
const recentJaGiven: string[] = [];
const recentEnFull: string[] = [];
const recentEnFirst: string[] = [];
const recentEnLast: string[] = [];

function remember(buffer: string[], value: string, limit: number) {
  buffer.push(value);
  if (buffer.length > limit) buffer.shift();
}

export function randomJaName(): JaName {
  const fullSeen = new Set(recentJaFull);
  const familySeen = new Set(recentJaFamily);
  const givenSeen = new Set(recentJaGiven);
  let name: JaName = {
    family: "",
    given: "",
    familyKana: "",
    givenKana: "",
  };

  for (let attempt = 0; attempt < MAX_NAME_TRIES; attempt += 1) {
    const family = pickOne(JA_SURNAMES);
    const given = pickOne(randomIndex(2) === 0 ? JA_GIVEN_MALE : JA_GIVEN_FEMALE);
    name = {
      family: family.kanji,
      given: given.kanji,
      familyKana: family.kana,
      givenKana: given.kana,
    };
    const full = jaKanji(name);
    const lastTry = attempt === MAX_NAME_TRIES - 1;
    if (
      lastTry ||
      (!fullSeen.has(full) && !familySeen.has(name.family) && !givenSeen.has(name.given))
    ) {
      remember(recentJaFull, full, RECENT_FULL);
      remember(recentJaFamily, name.family, RECENT_PART);
      remember(recentJaGiven, name.given, RECENT_PART);
      return name;
    }
  }

  return name;
}

export function randomEnName(): EnName {
  const fullSeen = new Set(recentEnFull);
  const firstSeen = new Set(recentEnFirst);
  const lastSeen = new Set(recentEnLast);
  let name: EnName = { first: "", last: "" };

  for (let attempt = 0; attempt < MAX_NAME_TRIES; attempt += 1) {
    name = {
      first: pickOne(randomIndex(2) === 0 ? EN_GIVEN_MALE : EN_GIVEN_FEMALE),
      last: pickOne(EN_SURNAMES),
    };
    const full = enFull(name);
    const lastTry = attempt === MAX_NAME_TRIES - 1;
    if (
      lastTry ||
      (!fullSeen.has(full) && !firstSeen.has(name.first) && !lastSeen.has(name.last))
    ) {
      remember(recentEnFull, full, RECENT_FULL);
      remember(recentEnFirst, name.first, RECENT_PART);
      remember(recentEnLast, name.last, RECENT_PART);
      return name;
    }
  }

  return name;
}

export function jaKanji(name: JaName): string {
  return `${name.family} ${name.given}`;
}

export function jaKana(name: JaName): string {
  return `${name.familyKana} ${name.givenKana}`;
}

export function enFull(name: EnName): string {
  return `${name.first} ${name.last}`;
}

type Ymd = { y: number; m: number; d: number };

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function shiftYears(date: Ymd, years: number): Ymd {
  const y = date.y + years;
  return { y, m: date.m, d: Math.min(date.d, daysInMonth(y, date.m)) };
}

function ordinal(date: Ymd): number {
  return Math.floor(Date.UTC(date.y, date.m - 1, date.d) / 86_400_000);
}

function fromOrdinal(value: number): Ymd {
  const date = new Date(value * 86_400_000);
  return {
    y: date.getUTCFullYear(),
    m: date.getUTCMonth() + 1,
    d: date.getUTCDate(),
  };
}

function addDays(date: Ymd, days: number): Ymd {
  return fromOrdinal(ordinal(date) + days);
}

function ageOn(birth: Ymd, today: Ymd): number {
  let age = today.y - birth.y;
  if (today.m < birth.m || (today.m === birth.m && today.d < birth.d)) age -= 1;
  return age;
}

function formatIso(date: Ymd): string {
  const month = String(date.m).padStart(2, "0");
  const day = String(date.d).padStart(2, "0");
  return `${date.y}/${month}/${day}`;
}

function localToday(now = new Date()): Ymd {
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

function agesForDecades(decades: readonly AgeDecade[]): number[] {
  const ages = new Set<number>();
  for (const decade of decades) {
    if (!AGE_DECADES.includes(decade)) continue;
    for (let age = decade; age < decade + 10; age += 1) ages.add(age);
  }
  return [...ages];
}

/** A birthday whose age, as of the local today, falls in one of the selected decades. */
export function randomBirthday(
  decades: readonly AgeDecade[],
  now = new Date(),
): Birthday | null {
  const ages = agesForDecades(decades);
  if (ages.length === 0) return null;
  const today = localToday(now);
  const age = pickOne(ages);
  const latest = shiftYears(today, -age);
  const earliest = addDays(shiftYears(today, -(age + 1)), 1);
  const span = ordinal(latest) - ordinal(earliest);
  if (span < 0) return null;
  const birth = fromOrdinal(ordinal(earliest) + randomIndex(span + 1));
  return { date: formatIso(birth), age: ageOn(birth, today) };
}

export function generateAccount(
  options: PasswordOptions & { decades: readonly AgeDecade[]; domain?: string },
): GeneratedAccount {
  return {
    email: randomEmail(options.domain),
    password: randomPassword(options),
    ja: randomJaName(),
    en: randomEnName(),
    birthday: randomBirthday(options.decades),
  };
}
