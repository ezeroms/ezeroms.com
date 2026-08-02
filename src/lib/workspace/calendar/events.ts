import "server-only";

import { getValidGoogleAccessToken } from "@/lib/workspace/calendar/tokens";
import type {
  GoogleCalendarEvent,
  GoogleCalendarListItem,
} from "@/types/calendar";

export type { GoogleCalendarEvent, GoogleCalendarListItem };

type CalendarListApiItem = {
  id?: string;
  summary?: string;
  primary?: boolean;
  accessRole?: string;
  backgroundColor?: string;
  foregroundColor?: string;
};

type EventApiItem = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  status?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

function isReadOnlyRole(role: string | undefined): boolean {
  return role === "reader" || role === "freeBusyReader";
}

async function googleGet<T>(
  accessToken: string,
  url: string,
): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 0 },
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(
      data.error?.message || `Google Calendar API ${res.status}`,
    );
  }
  return data;
}

export async function listGoogleCalendars(): Promise<GoogleCalendarListItem[]> {
  const auth = await getValidGoogleAccessToken();
  if (!auth) return [];

  const data = await googleGet<{ items?: CalendarListApiItem[] }>(
    auth.accessToken,
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader&maxResults=250",
  );

  return (data.items ?? [])
    .filter((c) => c.id)
    .map((c) => ({
      id: c.id!,
      summary: c.summary || c.id!,
      primary: Boolean(c.primary),
      accessRole: c.accessRole || "reader",
      backgroundColor: c.backgroundColor ?? null,
      foregroundColor: c.foregroundColor ?? null,
      readOnly: isReadOnlyRole(c.accessRole),
    }));
}

export async function listGoogleEvents(opts: {
  timeMin: string;
  timeMax: string;
  calendarIds?: string[];
  hiddenCalendarIds?: string[];
}): Promise<GoogleCalendarEvent[]> {
  const auth = await getValidGoogleAccessToken();
  if (!auth) return [];

  const calendars = await listGoogleCalendars();
  const hidden = new Set(opts.hiddenCalendarIds ?? []);
  const selected = calendars.filter((c) => {
    if (hidden.has(c.id)) return false;
    if (opts.calendarIds?.length) return opts.calendarIds.includes(c.id);
    return true;
  });

  const events: GoogleCalendarEvent[] = [];

  await Promise.all(
    selected.map(async (cal) => {
      const params = new URLSearchParams({
        timeMin: opts.timeMin,
        timeMax: opts.timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "100",
      });
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${params}`;
      try {
        const data = await googleGet<{ items?: EventApiItem[] }>(
          auth.accessToken,
          url,
        );
        for (const item of data.items ?? []) {
          if (!item.id) continue;
          if (item.status === "cancelled") continue;
          const start = item.start?.dateTime || item.start?.date;
          const end = item.end?.dateTime || item.end?.date;
          if (!start || !end) continue;
          events.push({
            id: item.id,
            calendarId: cal.id,
            calendarSummary: cal.summary,
            summary: item.summary || "(無題)",
            description: item.description ?? null,
            location: item.location ?? null,
            htmlLink: item.htmlLink ?? null,
            status: item.status ?? null,
            allDay: Boolean(item.start?.date && !item.start?.dateTime),
            start,
            end,
            accessRole: cal.accessRole,
            readOnly: cal.readOnly,
            backgroundColor: cal.backgroundColor,
          });
        }
      } catch {
        // Skip calendars that fail (permissions / deleted) without breaking the page.
      }
    }),
  );

  events.sort((a, b) => a.start.localeCompare(b.start));
  return events;
}

/** Short in-memory cache for today/week event fetches (not a source of truth). */
const eventCache = new Map<
  string,
  { at: number; events: GoogleCalendarEvent[] }
>();
const CACHE_TTL_MS = 2 * 60 * 1000;

export async function listGoogleEventsCached(opts: {
  timeMin: string;
  timeMax: string;
  hiddenCalendarIds?: string[];
}): Promise<GoogleCalendarEvent[]> {
  const key = JSON.stringify({
    timeMin: opts.timeMin,
    timeMax: opts.timeMax,
    hidden: [...(opts.hiddenCalendarIds ?? [])].sort(),
  });
  const hit = eventCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.events;
  }
  const events = await listGoogleEvents(opts);
  eventCache.set(key, { at: Date.now(), events });
  return events;
}

export function clearGoogleEventsCache(): void {
  eventCache.clear();
}

function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo";
  } catch {
    return "Asia/Tokyo";
  }
}

async function googleJson<T>(
  accessToken: string,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    next: { revalidate: 0 },
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(
      data.error?.message || `Google Calendar API ${res.status}`,
    );
  }
  return data;
}

export type CreateWorkBlockInput = {
  calendarId: string;
  summary: string;
  description?: string | null;
  startIso: string;
  endIso: string;
  timeZone?: string;
};

export type CreatedGoogleEvent = {
  id: string;
  calendarId: string;
  summary: string;
  htmlLink: string | null;
  start: string;
  end: string;
};

export type UpdateGoogleEventInput = {
  calendarId: string;
  eventId: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  description?: string | null;
  location?: string | null;
  timeZone?: string;
};

/** Creates a timed event. Caller must verify write scope + writable calendar. */
export async function createGoogleWorkBlock(
  input: CreateWorkBlockInput,
): Promise<CreatedGoogleEvent> {
  const auth = await getValidGoogleAccessToken();
  if (!auth) throw new Error("Google Calendar is not connected");

  const timeZone = input.timeZone || localTimeZone();
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events`;
  const data = await googleJson<EventApiItem>(auth.accessToken, url, {
    method: "POST",
    body: JSON.stringify({
      summary: input.summary,
      description: input.description || undefined,
      start: { dateTime: input.startIso, timeZone },
      end: { dateTime: input.endIso, timeZone },
    }),
  });

  if (!data.id) throw new Error("Google did not return an event id");
  const start = data.start?.dateTime || data.start?.date || input.startIso;
  const end = data.end?.dateTime || data.end?.date || input.endIso;

  clearGoogleEventsCache();

  return {
    id: data.id,
    calendarId: input.calendarId,
    summary: data.summary || input.summary,
    htmlLink: data.htmlLink ?? null,
    start,
    end,
  };
}

/** Updates only the basic fields exposed by the workspace event editor. */
export async function updateGoogleEvent(
  input: UpdateGoogleEventInput,
): Promise<GoogleCalendarEvent> {
  const auth = await getValidGoogleAccessToken();
  if (!auth) throw new Error("Google Calendar is not connected");

  const calendar = await assertCalendarIsWritable(input.calendarId);
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`;
  const timeZone = input.timeZone || localTimeZone();
  const data = await googleJson<EventApiItem>(auth.accessToken, url, {
    method: "PATCH",
    body: JSON.stringify({
      summary: input.summary,
      description:
        input.description !== undefined ? input.description || "" : undefined,
      location:
        input.location !== undefined ? input.location || "" : undefined,
      start: input.allDay
        ? { date: input.start }
        : { dateTime: input.start, timeZone },
      end: input.allDay
        ? { date: input.end }
        : { dateTime: input.end, timeZone },
    }),
  });

  if (!data.id) throw new Error("Google did not return an event id");
  const start = data.start?.dateTime || data.start?.date;
  const end = data.end?.dateTime || data.end?.date;
  if (!start || !end) throw new Error("Google did not return event dates");

  clearGoogleEventsCache();
  return {
    id: data.id,
    calendarId: input.calendarId,
    calendarSummary: calendar.summary,
    summary: data.summary || input.summary,
    description: data.description ?? null,
    location: data.location ?? null,
    htmlLink: data.htmlLink ?? null,
    status: data.status ?? null,
    allDay: Boolean(data.start?.date && !data.start?.dateTime),
    start,
    end,
    accessRole: calendar.accessRole,
    readOnly: calendar.readOnly,
    backgroundColor: calendar.backgroundColor,
  };
}

export async function assertCalendarIsWritable(
  calendarId: string,
): Promise<GoogleCalendarListItem> {
  const calendars = await listGoogleCalendars();
  const cal = calendars.find((c) => c.id === calendarId);
  if (!cal) throw new Error("指定したカレンダーが見つかりません");
  if (cal.readOnly) {
    throw new Error(
      "読み取り専用カレンダーには書き込めません。書き込み可能なカレンダーを選んでください",
    );
  }
  return cal;
}
