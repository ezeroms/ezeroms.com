import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  assertCalendarIsWritable,
  clearGoogleEventsCache,
  listGoogleCalendars,
} from "@/lib/workspace/calendar/events";
import { tokenHasCalendarWriteScope } from "@/lib/workspace/calendar/oauth";
import {
  getCalendarPreferences,
  updateCalendarPreferences,
  type CalendarPreferences,
  type WeekStartsOn,
} from "@/lib/workspace/calendar/prefs";
import { getStoredGoogleToken } from "@/lib/workspace/calendar/tokens";
import {
  DEFAULT_PRIMARY_LABEL,
  DEFAULT_PRIMARY_TIMEZONE,
  DEFAULT_SECONDARY_LABEL,
  DEFAULT_SECONDARY_TIMEZONE,
  isValidTimeZone,
} from "@/lib/workspace/calendar/timezones";

function prefsPayload(prefs: CalendarPreferences) {
  return {
    hiddenCalendarIds: prefs.hidden_calendar_ids,
    writableCalendarId: prefs.writable_calendar_id,
    weekStartsOn: prefs.week_starts_on,
    dayStartsHour: prefs.day_starts_hour,
    primaryTimezone: prefs.primary_timezone,
    primaryLabel: prefs.primary_timezone_label,
    secondaryTimezoneEnabled: prefs.secondary_timezone_enabled,
    secondaryTimezone: prefs.secondary_timezone,
    secondaryLabel: prefs.secondary_timezone_label,
  };
}

export async function GET() {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const stored = await getStoredGoogleToken();
    if (!stored) {
      return NextResponse.json({
        connected: false,
        calendars: [],
        hiddenCalendarIds: [],
        writableCalendarId: null,
        weekStartsOn: "monday" as WeekStartsOn,
        dayStartsHour: 0,
        primaryTimezone: DEFAULT_PRIMARY_TIMEZONE,
        primaryLabel: DEFAULT_PRIMARY_LABEL,
        secondaryTimezoneEnabled: false,
        secondaryTimezone: DEFAULT_SECONDARY_TIMEZONE,
        secondaryLabel: DEFAULT_SECONDARY_LABEL,
        canWrite: false,
      });
    }

    const [calendars, prefs] = await Promise.all([
      listGoogleCalendars(),
      getCalendarPreferences(),
    ]);

    return NextResponse.json({
      connected: true,
      email: stored.google_email,
      calendars,
      ...prefsPayload(prefs),
      canWrite: tokenHasCalendarWriteScope(stored.scope),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list calendars" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      hiddenCalendarIds?: string[];
      writableCalendarId?: string | null;
      weekStartsOn?: WeekStartsOn;
      dayStartsHour?: number;
      primaryTimezone?: string;
      primaryLabel?: string;
      secondaryTimezoneEnabled?: boolean;
      secondaryTimezone?: string;
      secondaryLabel?: string;
    };

    const current = await getCalendarPreferences();
    const patch: Parameters<typeof updateCalendarPreferences>[0] = {};

    if (Array.isArray(body.hiddenCalendarIds)) {
      patch.hidden_calendar_ids = body.hiddenCalendarIds.filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      );
    }

    if (body.writableCalendarId !== undefined) {
      if (
        body.writableCalendarId !== null &&
        typeof body.writableCalendarId !== "string"
      ) {
        return NextResponse.json(
          { error: "writableCalendarId must be a string or null" },
          { status: 400 },
        );
      }
      if (body.writableCalendarId) {
        await assertCalendarIsWritable(body.writableCalendarId);
      }
      patch.writable_calendar_id = body.writableCalendarId;
    }

    if (body.weekStartsOn !== undefined) {
      if (body.weekStartsOn !== "monday" && body.weekStartsOn !== "sunday") {
        return NextResponse.json(
          { error: "weekStartsOn must be monday or sunday" },
          { status: 400 },
        );
      }
      patch.week_starts_on = body.weekStartsOn;
    }

    if (body.dayStartsHour !== undefined) {
      if (
        typeof body.dayStartsHour !== "number" ||
        !Number.isInteger(body.dayStartsHour) ||
        body.dayStartsHour < 0 ||
        body.dayStartsHour > 23
      ) {
        return NextResponse.json(
          { error: "dayStartsHour must be an integer 0–23" },
          { status: 400 },
        );
      }
      patch.day_starts_hour = body.dayStartsHour;
    }

    const timezoneTouched =
      body.primaryTimezone !== undefined ||
      body.primaryLabel !== undefined ||
      body.secondaryTimezoneEnabled !== undefined ||
      body.secondaryTimezone !== undefined ||
      body.secondaryLabel !== undefined;

    if (timezoneTouched) {
      const primaryTimezone =
        body.primaryTimezone ?? current.primary_timezone;
      const secondaryTimezone =
        body.secondaryTimezone ?? current.secondary_timezone;
      if (!isValidTimeZone(primaryTimezone)) {
        return NextResponse.json(
          { error: "primaryTimezone must be a valid IANA time zone" },
          { status: 400 },
        );
      }
      if (!isValidTimeZone(secondaryTimezone)) {
        return NextResponse.json(
          { error: "secondaryTimezone must be a valid IANA time zone" },
          { status: 400 },
        );
      }
      patch.primary_timezone = primaryTimezone;
      patch.primary_timezone_label =
        typeof body.primaryLabel === "string"
          ? body.primaryLabel
          : current.primary_timezone_label;
      patch.secondary_timezone_enabled =
        body.secondaryTimezoneEnabled !== undefined
          ? Boolean(body.secondaryTimezoneEnabled)
          : current.secondary_timezone_enabled;
      patch.secondary_timezone = secondaryTimezone;
      patch.secondary_timezone_label =
        typeof body.secondaryLabel === "string"
          ? body.secondaryLabel
          : current.secondary_timezone_label;
    }

    const prefs = await updateCalendarPreferences(patch);
    clearGoogleEventsCache();
    return NextResponse.json(prefsPayload(prefs));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update preferences" },
      { status: 500 },
    );
  }
}
