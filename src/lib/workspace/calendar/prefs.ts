import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import type { WeekStartsOn } from "@/lib/workspace/calendar/time";
import {
  DEFAULT_PRIMARY_LABEL,
  DEFAULT_PRIMARY_TIMEZONE,
  DEFAULT_SECONDARY_LABEL,
  DEFAULT_SECONDARY_TIMEZONE,
  parseTimeZone,
  parseTimezoneLabel,
} from "@/lib/workspace/calendar/timezones";

export type { WeekStartsOn };

export type CalendarPreferences = {
  hidden_calendar_ids: string[];
  writable_calendar_id: string | null;
  week_starts_on: WeekStartsOn;
  day_starts_hour: number;
  primary_timezone: string;
  primary_timezone_label: string;
  secondary_timezone_enabled: boolean;
  secondary_timezone: string;
  secondary_timezone_label: string;
};

export type CalendarPreferencesPatch = Partial<{
  hidden_calendar_ids: string[];
  writable_calendar_id: string | null;
  week_starts_on: WeekStartsOn;
  day_starts_hour: number;
  primary_timezone: string;
  primary_timezone_label: string;
  secondary_timezone_enabled: boolean;
  secondary_timezone: string;
  secondary_timezone_label: string;
}>;

function parseWeekStartsOn(value: unknown): WeekStartsOn {
  return value === "sunday" ? "sunday" : "monday";
}

function parseDayStartsHour(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 23) return 0;
  return n;
}

function mapPrefsRow(data: Record<string, unknown> | null): CalendarPreferences {
  const primaryTimezone = parseTimeZone(
    data?.primary_timezone,
    DEFAULT_PRIMARY_TIMEZONE,
  );
  const secondaryTimezone = parseTimeZone(
    data?.secondary_timezone,
    DEFAULT_SECONDARY_TIMEZONE,
  );
  return {
    hidden_calendar_ids: (data?.hidden_calendar_ids as string[] | null) ?? [],
    writable_calendar_id:
      (data?.writable_calendar_id as string | null | undefined) ?? null,
    week_starts_on: parseWeekStartsOn(data?.week_starts_on),
    day_starts_hour: parseDayStartsHour(data?.day_starts_hour),
    primary_timezone: primaryTimezone,
    primary_timezone_label: parseTimezoneLabel(
      data?.primary_timezone_label,
      DEFAULT_PRIMARY_LABEL,
    ),
    secondary_timezone_enabled: Boolean(data?.secondary_timezone_enabled),
    secondary_timezone: secondaryTimezone,
    secondary_timezone_label: parseTimezoneLabel(
      data?.secondary_timezone_label,
      DEFAULT_SECONDARY_LABEL,
    ),
  };
}

const PREFS_SELECT =
  "hidden_calendar_ids, writable_calendar_id, week_starts_on, day_starts_hour, primary_timezone, primary_timezone_label, secondary_timezone_enabled, secondary_timezone, secondary_timezone_label";

export async function getCalendarPreferences(): Promise<CalendarPreferences> {
  const { data, error } = await getWorkspaceAdmin()
    .from("calendar_preferences")
    .select(PREFS_SELECT)
    .eq("id", "default")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapPrefsRow((data as Record<string, unknown> | null) ?? null);
}

/** Single upsert for any calendar preference fields. */
export async function updateCalendarPreferences(
  patch: CalendarPreferencesPatch,
): Promise<CalendarPreferences> {
  const current = await getCalendarPreferences();
  const { data, error } = await getWorkspaceAdmin()
    .from("calendar_preferences")
    .upsert(
      {
        id: "default",
        hidden_calendar_ids:
          patch.hidden_calendar_ids ?? current.hidden_calendar_ids,
        writable_calendar_id:
          patch.writable_calendar_id !== undefined
            ? patch.writable_calendar_id
            : current.writable_calendar_id,
        week_starts_on: patch.week_starts_on ?? current.week_starts_on,
        day_starts_hour:
          patch.day_starts_hour !== undefined
            ? parseDayStartsHour(patch.day_starts_hour)
            : current.day_starts_hour,
        primary_timezone: parseTimeZone(
          patch.primary_timezone ?? current.primary_timezone,
          DEFAULT_PRIMARY_TIMEZONE,
        ),
        primary_timezone_label: parseTimezoneLabel(
          patch.primary_timezone_label ?? current.primary_timezone_label,
          DEFAULT_PRIMARY_LABEL,
        ),
        secondary_timezone_enabled:
          patch.secondary_timezone_enabled !== undefined
            ? Boolean(patch.secondary_timezone_enabled)
            : current.secondary_timezone_enabled,
        secondary_timezone: parseTimeZone(
          patch.secondary_timezone ?? current.secondary_timezone,
          DEFAULT_SECONDARY_TIMEZONE,
        ),
        secondary_timezone_label: parseTimezoneLabel(
          patch.secondary_timezone_label ?? current.secondary_timezone_label,
          DEFAULT_SECONDARY_LABEL,
        ),
      },
      { onConflict: "id" },
    )
    .select(PREFS_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return mapPrefsRow(data as Record<string, unknown>);
}

export async function setHiddenCalendarIds(
  ids: string[],
): Promise<CalendarPreferences> {
  return updateCalendarPreferences({ hidden_calendar_ids: ids });
}

export async function setWritableCalendarId(
  calendarId: string | null,
): Promise<CalendarPreferences> {
  return updateCalendarPreferences({ writable_calendar_id: calendarId });
}

export async function setWeekStartsOn(
  weekStartsOn: WeekStartsOn,
): Promise<CalendarPreferences> {
  return updateCalendarPreferences({ week_starts_on: weekStartsOn });
}

export async function setDayStartsHour(
  hour: number,
): Promise<CalendarPreferences> {
  return updateCalendarPreferences({
    day_starts_hour: parseDayStartsHour(hour),
  });
}

export async function setTimezonePreferences(input: {
  primaryTimezone: string;
  primaryLabel: string;
  secondaryTimezoneEnabled: boolean;
  secondaryTimezone: string;
  secondaryLabel: string;
}): Promise<CalendarPreferences> {
  return updateCalendarPreferences({
    primary_timezone: input.primaryTimezone,
    primary_timezone_label: input.primaryLabel,
    secondary_timezone_enabled: input.secondaryTimezoneEnabled,
    secondary_timezone: input.secondaryTimezone,
    secondary_timezone_label: input.secondaryLabel,
  });
}
