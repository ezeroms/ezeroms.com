import "temporal-polyfill/global";

/** Curated IANA zones + helpers for calendar timezone prefs. */

export const DEFAULT_PRIMARY_TIMEZONE = "Asia/Tokyo";
export const DEFAULT_PRIMARY_LABEL = "Tokyo";
export const DEFAULT_SECONDARY_TIMEZONE = "Asia/Taipei";
export const DEFAULT_SECONDARY_LABEL = "Taipei";

/** Common zones for the options picker (order ≈ Google Calendar). */
export const CALENDAR_TIMEZONE_OPTIONS: readonly string[] = [
  "Asia/Tokyo",
  "Asia/Taipei",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Seoul",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Manila",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "UTC",
] as const;

export type CalendarTimezonePrefs = {
  primaryTimezone: string;
  primaryLabel: string;
  secondaryTimezoneEnabled: boolean;
  secondaryTimezone: string;
  secondaryLabel: string;
};

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_PRIMARY_TIMEZONE;
  } catch {
    return DEFAULT_PRIMARY_TIMEZONE;
  }
}

export function isValidTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function parseTimeZone(
  value: unknown,
  fallback: string = DEFAULT_PRIMARY_TIMEZONE,
): string {
  if (typeof value === "string" && isValidTimeZone(value)) return value;
  return fallback;
}

export function parseTimezoneLabel(
  value: unknown,
  fallback: string,
): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().slice(0, 32);
  return trimmed || fallback;
}

/** Default short label from IANA id (`Asia/Tokyo` → `Tokyo`). */
export function defaultLabelForTimeZone(tz: string): string {
  const part = tz.split("/").pop() ?? tz;
  return part.replaceAll("_", " ");
}

function gmtOffsetString(timeZone: string, at = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const raw =
    parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  // "GMT+9" → "GMT+09:00", "GMT" → "GMT+00:00"
  const m = raw.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!m) return "GMT+00:00";
  const sign = m[1];
  const hh = String(Number(m[2])).padStart(2, "0");
  const mm = m[3] ?? "00";
  return `GMT${sign}${hh}:${mm}`;
}

/** e.g. `(GMT+09:00) 日本標準時` */
export function formatTimezoneOptionLabel(
  timeZone: string,
  locale = "ja",
): string {
  const offset = gmtOffsetString(timeZone);
  let name = timeZone;
  try {
    const dn = new Intl.DisplayNames([locale], {
      type: "timeZone" as Intl.DisplayNamesOptions["type"],
    });
    name = dn.of(timeZone) ?? timeZone;
  } catch {
    /* keep id */
  }
  return `(${offset}) ${name}`;
}

export function timezoneSelectOptions(
  extra: string[] = [],
): { value: string; label: string }[] {
  const browser = browserTimeZone();
  const set = new Set<string>([
    ...CALENDAR_TIMEZONE_OPTIONS,
    browser,
    ...extra.filter(isValidTimeZone),
  ]);
  return [...set]
    .sort((a, b) =>
      formatTimezoneOptionLabel(a).localeCompare(
        formatTimezoneOptionLabel(b),
        "ja",
      ),
    )
    .map((value) => ({
      value,
      label: formatTimezoneOptionLabel(value),
    }));
}

/** Format an axis hour as HH:MM. After midnight until dayStartsHour → 24+. */
export function formatAxisClock(
  hour: number,
  minute = 0,
  dayStartsHour = 0,
): string {
  const h24 = ((hour % 24) + 24) % 24;
  const m = ((minute % 60) + 60) % 60;
  const start = ((dayStartsHour % 24) + 24) % 24;
  const display = start > 0 && h24 < start ? h24 + 24 : h24;
  return `${String(display).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Hybrid calendar date (YYYY-MM-DD) for an instant: hours before
 * `dayStartsHour` belong to the previous calendar day.
 */
export function hybridDateKeyInTimeZone(
  instantMs: number,
  dayStartsHour: number,
  timeZone: string,
): string {
  const start = ((dayStartsHour % 24) + 24) % 24;
  try {
    const zdt = Temporal.Instant.fromEpochMilliseconds(instantMs)
      .toZonedDateTimeISO(timeZone)
      .subtract({ hours: start });
    return `${zdt.year}-${String(zdt.month).padStart(2, "0")}-${String(zdt.day).padStart(2, "0")}`;
  } catch {
    const d = new Date(instantMs);
    d.setHours(d.getHours() - start);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
}

/**
 * Same absolute instant as `primaryHour:primaryMinute` on `refDate` in
 * `primaryTz`, expressed as wall clock in `secondaryTz`.
 */
export function secondaryAxisClock(
  primaryHour: number,
  primaryMinute: number,
  primaryTz: string,
  secondaryTz: string,
  refDate?: { year: number; month: number; day: number },
): string {
  try {
    const date =
      refDate ??
      (() => {
        const z = Temporal.Now.zonedDateTimeISO(primaryTz);
        return { year: z.year, month: z.month, day: z.day };
      })();
    const zdt = Temporal.ZonedDateTime.from({
      timeZone: primaryTz,
      year: date.year,
      month: date.month,
      day: date.day,
      hour: ((primaryHour % 24) + 24) % 24,
      minute: ((primaryMinute % 60) + 60) % 60,
      second: 0,
    });
    const other = zdt.withTimeZone(secondaryTz);
    return formatAxisClock(other.hour, other.minute);
  } catch {
    return formatAxisClock(primaryHour, primaryMinute);
  }
}

/** Wall-clock Date in `timeZone` for drop / scheduling. */
export function wallClockDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  try {
    const zdt = Temporal.ZonedDateTime.from({
      timeZone,
      year,
      month,
      day,
      hour,
      minute,
      second: 0,
    });
    return new Date(zdt.epochMilliseconds);
  } catch {
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }
}

/** Current clock hour/minute in a timezone (for scroll-to-now). */
export function nowInTimeZone(timeZone: string): {
  hour: number;
  minute: number;
} {
  try {
    const zdt = Temporal.Now.zonedDateTimeISO(timeZone);
    return { hour: zdt.hour, minute: zdt.minute };
  } catch {
    const n = new Date();
    return { hour: n.getHours(), minute: n.getMinutes() };
  }
}
