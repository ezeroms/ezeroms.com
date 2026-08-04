import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { attachContactsToCalendarEvent } from "@/lib/workspace/activity-calendar-links";
import { getActivityWithContacts } from "@/lib/workspace/activities";

/**
 * Attach contacts to a Google Calendar event.
 * Creates a local Activity (with calendar link) on first attach.
 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      google_calendar_id?: string;
      google_event_id?: string;
      summary?: string;
      start?: string | null;
      end?: string | null;
      location?: string | null;
      contact_ids?: unknown;
      friend_ids?: unknown;
    };

    const googleCalendarId = body.google_calendar_id?.trim();
    const googleEventId = body.google_event_id?.trim();
    if (!googleCalendarId || !googleEventId) {
      return NextResponse.json(
        { error: "google_calendar_id and google_event_id are required" },
        { status: 400 },
      );
    }
    const raw = Array.isArray(body.contact_ids)
      ? body.contact_ids
      : Array.isArray(body.friend_ids)
        ? body.friend_ids
        : null;
    if (!raw) {
      return NextResponse.json(
        { error: "contact_ids must be an array" },
        { status: 400 },
      );
    }
    const contactIds = raw.filter(
      (v): v is string => typeof v === "string" && Boolean(v),
    );

    const { activity } = await attachContactsToCalendarEvent({
      googleCalendarId,
      googleEventId,
      summary: body.summary?.trim() || "（無題）",
      start: body.start ?? null,
      end: body.end ?? null,
      location: body.location ?? null,
      contactIds,
    });

    const item = await getActivityWithContacts(activity.id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Failed to attach contacts to calendar event",
      },
      { status: 500 },
    );
  }
}
