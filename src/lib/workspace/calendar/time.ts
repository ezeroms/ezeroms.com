import { formatAxisClock } from "@/lib/workspace/calendar/timezones";

/**
 * ローカルタイムゾーンでの日付キー（YYYY-MM-DD）。
 * カレンダーの日境界・scheduled_date など、日付だけ揃えたいときに使う。
 */
export function localDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** ISO 日時文字列からローカル日付キーを取る。不正な値は先頭10文字にフォールバック。 */
export function localDateKeyFromIso(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return localDateKey(date);
}

/**
 * ISO 瞬間 → `<input type="datetime-local">` 用の値（タイムゾーン指定）。
 * 例: 2026-08-01T15:30
 */
export function isoToDatetimeLocal(iso: string, timeZone: string): string {
  try {
    const zoned = Temporal.Instant.from(iso).toZonedDateTimeISO(timeZone);
    const hour = String(zoned.hour).padStart(2, "0");
    const minute = String(zoned.minute).padStart(2, "0");
    return `${zoned.toPlainDate()}T${hour}:${minute}`;
  } catch {
    return iso.slice(0, 16);
  }
}

/** datetime-local の値を、指定タイムゾーンの瞬間（ISO）に戻す。 */
export function datetimeLocalToIso(value: string, timeZone: string): string {
  return Temporal.PlainDateTime.from(value)
    .toZonedDateTime(timeZone)
    .toInstant()
    .toString();
}

/** Start of local day as Date. */
export function startOfLocalDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function endOfLocalDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export type WeekStartsOn = "monday" | "sunday";

/**
 * Calendar week containing `d`.
 * monday: Mon 00:00 → next Mon 00:00
 * sunday: Sun 00:00 → next Sun 00:00
 */
export function calendarWeekRange(
  d = new Date(),
  weekStartsOn: WeekStartsOn = "monday",
): {
  timeMin: string;
  timeMax: string;
} {
  const start = startOfLocalDay(d);
  const day = start.getDay(); // 0=Sun … 6=Sat
  const startDow = weekStartsOn === "monday" ? 1 : 0;
  const diff = (day - startDow + 7) % 7;
  start.setDate(start.getDate() - diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

export function todayRange(d = new Date()): { timeMin: string; timeMax: string } {
  return {
    timeMin: startOfLocalDay(d).toISOString(),
    timeMax: endOfLocalDay(d).toISOString(),
  };
}

/** HH:mm with 24+ hours when past midnight on a hybrid day. */
export function formatHybridClock(
  hour: number,
  minute: number,
  dayStartsHour = 0,
): string {
  return formatAxisClock(hour, minute, dayStartsHour);
}

/** Timed range as `HH:mm – HH:mm` (hybrid 24+ when applicable). */
export function formatHybridTimeRange(
  start: { hour: number; minute: number },
  end: { hour: number; minute: number },
  dayStartsHour = 0,
  delimiter = " – ",
): string {
  const from = formatHybridClock(start.hour, start.minute, dayStartsHour);
  if (start.hour === end.hour && start.minute === end.minute) return from;
  return `${from}${delimiter}${formatHybridClock(end.hour, end.minute, dayStartsHour)}`;
}

export function formatEventTimeRange(
  start: string,
  end: string,
  allDay: boolean,
  dayStartsHour = 0,
): string {
  if (allDay) return "終日";
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  return formatHybridTimeRange(
    { hour: s.getHours(), minute: s.getMinutes() },
    { hour: e.getHours(), minute: e.getMinutes() },
    dayStartsHour,
    "–",
  );
}

/** schedule-x WeekDay: Monday=1 … Sunday=7 */
export function toScheduleXFirstDay(
  weekStartsOn: WeekStartsOn,
): 1 | 7 {
  return weekStartsOn === "sunday" ? 7 : 1;
}

/** HH:mm for schedule-x dayBoundaries. */
export function hourToBoundaryTime(hour: number): string {
  const h = Math.min(23, Math.max(0, Math.floor(hour)));
  return `${String(h).padStart(2, "0")}:00`;
}

/**
 * Full 24h grid beginning at `dayStartsHour`.
 * hour=0 → 00:00–24:00; hour=6 → 06:00–06:00 (hybrid day).
 */
export function toScheduleXDayBoundaries(dayStartsHour: number): {
  start: string;
  end: string;
} {
  const h = Math.min(23, Math.max(0, Math.floor(dayStartsHour)));
  if (h === 0) return { start: "00:00", end: "24:00" };
  const t = hourToBoundaryTime(h);
  return { start: t, end: t };
}

/** Minutes from the top of the time grid (accounts for dayStartsHour). */
export function minutesFromDayStart(
  absoluteMinutes: number,
  dayStartsHour: number,
): number {
  const dayStart = ((dayStartsHour % 24) + 24) % 24 * 60;
  return (absoluteMinutes - dayStart + 24 * 60) % (24 * 60);
}

export function absoluteMinutesFromDayOffset(
  offsetMinutes: number,
  dayStartsHour: number,
): number {
  const dayStart = ((dayStartsHour % 24) + 24) % 24 * 60;
  return (dayStart + offsetMinutes) % (24 * 60);
}
