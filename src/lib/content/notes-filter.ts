import type { Diary } from "@/types/content";
import { diaryMonthKey } from "@/lib/content/diary-meta";

export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type NotesFilterState = {
  months: string[];
  weekdays: number[];
  tags: string[];
  places: string[];
};

export function emptyNotesFilter(): NotesFilterState {
  return { months: [], weekdays: [], tags: [], places: [] };
}

export function notesFilterActive(f: NotesFilterState): boolean {
  return (
    f.months.length > 0 ||
    f.weekdays.length > 0 ||
    f.tags.length > 0 ||
    f.places.length > 0
  );
}

/** Parse `/diary/?m=&w=&t=&p=` */
export function parseNotesFilter(
  sp: Record<string, string | string[] | undefined>,
): NotesFilterState {
  const one = (key: string) => {
    const v = sp[key];
    if (Array.isArray(v)) return v[0] ?? "";
    return v ?? "";
  };
  const months = one("m")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}$/.test(s));
  const weekdays = one("w")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  const tags = one("t")
    .split("|")
    .map((s) => {
      try {
        return decodeURIComponent(s.trim());
      } catch {
        return s.trim();
      }
    })
    .filter(Boolean);
  const places = one("p")
    .split("|")
    .map((s) => {
      try {
        return decodeURIComponent(s.trim());
      } catch {
        return s.trim();
      }
    })
    .filter(Boolean);
  return { months, weekdays, tags, places };
}

export function serializeNotesFilter(f: NotesFilterState): string {
  const q = new URLSearchParams();
  if (f.months.length) q.set("m", f.months.join(","));
  if (f.weekdays.length) q.set("w", f.weekdays.join(","));
  if (f.tags.length) {
    q.set("t", f.tags.map((t) => encodeURIComponent(t)).join("|"));
  }
  if (f.places.length) {
    q.set("p", f.places.map((p) => encodeURIComponent(p)).join("|"));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  if (!y || !m) return ym;
  return `${y}年${Number(m)}月`;
}

export function diaryMatchesMonths(item: Diary, months: string[]): boolean {
  if (!months.length) return true;
  const key = diaryMonthKey(item);
  if (months.includes(key)) return true;
  return (item.diary_month ?? []).some((raw) => {
    const slash = raw.match(/^(\d{4})\/(\d{1,2})/);
    if (slash) {
      return months.includes(
        `${slash[1]}-${slash[2].padStart(2, "0")}`,
      );
    }
    return months.includes(raw.slice(0, 7));
  });
}

export function diaryMatchesWeekdays(item: Diary, weekdays: number[]): boolean {
  if (!weekdays.length) return true;
  const day = new Date(item.date).getDay();
  return weekdays.includes(day);
}

/** Match YYYY-MM against an ISO date string (clips / generic). */
export function dateMatchesMonths(iso: string, months: string[]): boolean {
  if (!months.length) return true;
  const key = iso.slice(0, 7);
  return months.includes(key);
}

export function dateMatchesWeekdays(iso: string, weekdays: number[]): boolean {
  if (!weekdays.length) return true;
  const day = new Date(iso).getDay();
  return weekdays.includes(day);
}
