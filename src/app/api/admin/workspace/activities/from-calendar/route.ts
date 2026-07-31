import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { attachFriendsToCalendarEvent } from "@/lib/workspace/activity-calendar-links";
import { getActivityWithFriends } from "@/lib/workspace/activities";

/**
 * Attach friends to a Google Calendar event.
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
    if (!Array.isArray(body.friend_ids)) {
      return NextResponse.json(
        { error: "friend_ids must be an array" },
        { status: 400 },
      );
    }
    const friendIds = body.friend_ids.filter(
      (v): v is string => typeof v === "string" && Boolean(v),
    );

    const { activity } = await attachFriendsToCalendarEvent({
      googleCalendarId,
      googleEventId,
      summary: body.summary?.trim() || "（無題）",
      start: body.start ?? null,
      end: body.end ?? null,
      location: body.location ?? null,
      friendIds,
    });

    const item = await getActivityWithFriends(activity.id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Failed to attach friends to calendar event",
      },
      { status: 500 },
    );
  }
}
