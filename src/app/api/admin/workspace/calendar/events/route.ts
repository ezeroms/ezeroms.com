import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { logActivity } from "@/lib/workspace/activity-log";
import {
  assertCalendarIsWritable,
  createGoogleWorkBlock,
  clearGoogleEventsCache,
  listGoogleEventsCached,
  updateGoogleEvent,
} from "@/lib/workspace/calendar/events";
import { listActivityLinksForEvents } from "@/lib/workspace/activity-calendar-links";
import {
  listTaskLinksForEvents,
  upsertCalendarLink,
} from "@/lib/workspace/calendar/links";
import { tokenHasCalendarWriteScope } from "@/lib/workspace/calendar/oauth";
import { requireGoogleCalendarWriteAccess } from "@/lib/workspace/calendar/require-write-access";
import {
  todayRange,
  calendarWeekRange,
  localDateKeyFromIso,
} from "@/lib/workspace/calendar/time";
import { isValidTimeZone } from "@/lib/workspace/calendar/timezones";
import {
  getCalendarPreferences,
  getStoredGoogleToken,
} from "@/lib/workspace/calendar/tokens";
import { getTask, updateTask } from "@/lib/workspace/tasks";

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const stored = await getStoredGoogleToken();
    if (!stored) {
      return NextResponse.json({
        connected: false,
        events: [],
        taskLinks: [],
        activityLinks: [],
        canWrite: false,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") === "today" ? "today" : "week";
    const refresh = searchParams.get("refresh") === "1";
    if (refresh) clearGoogleEventsCache();

    const prefs = await getCalendarPreferences();
    const bounds =
      range === "today"
        ? todayRange()
        : calendarWeekRange(new Date(), prefs.week_starts_on);

    const timeMin = searchParams.get("timeMin") || bounds.timeMin;
    const timeMax = searchParams.get("timeMax") || bounds.timeMax;

    const events = await listGoogleEventsCached({
      timeMin,
      timeMax,
      hiddenCalendarIds: prefs.hidden_calendar_ids,
    });
    const eventIds = events.map((event) => event.id);
    const [taskLinks, activityLinks] = await Promise.all([
      listTaskLinksForEvents(eventIds),
      listActivityLinksForEvents(eventIds),
    ]);

    return NextResponse.json({
      connected: true,
      email: stored.google_email,
      range,
      timeMin,
      timeMax,
      events,
      taskLinks,
      activityLinks,
      canWrite: tokenHasCalendarWriteScope(stored.scope),
      writableCalendarId: prefs.writable_calendar_id,
      // access_token / refresh_token は絶対に返さない
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load events",
      },
      { status: 500 },
    );
  }
}

type CreateBody = {
  /** true なら Google へ書かず検証結果だけ返す */
  preview?: boolean;
  taskId?: string;
  calendarId?: string;
  summary?: string;
  description?: string;
  start?: string;
  end?: string;
  /** end 省略時の長さ（分） */
  durationMinutes?: number;
  /** 作成後に task.scheduled_date を開始日へ合わせる（既定 true） */
  setScheduledDate?: boolean;
};

/** start + durationMinutes（または end）から終了 ISO を決める。失敗時はエラー Response。 */
function resolveCreateEndIso(
  body: CreateBody,
  startMs: number,
): { endIso: string } | { error: NextResponse } {
  if (!body.end) {
    const minutes =
      typeof body.durationMinutes === "number" && body.durationMinutes > 0
        ? body.durationMinutes
        : 60;
    return { endIso: new Date(startMs + minutes * 60_000).toISOString() };
  }
  if (Number.isNaN(Date.parse(body.end))) {
    return {
      error: NextResponse.json(
        { error: "Invalid end datetime" },
        { status: 400 },
      ),
    };
  }
  if (Date.parse(body.end) <= startMs) {
    return {
      error: NextResponse.json(
        { error: "end must be after start" },
        { status: 400 },
      ),
    };
  }
  return { endIso: body.end };
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const writeAccess = await requireGoogleCalendarWriteAccess();
    if (writeAccess.error) return writeAccess.error;

    const body = (await request.json()) as CreateBody;
    if (!body.start || typeof body.start !== "string") {
      return NextResponse.json({ error: "start is required" }, { status: 400 });
    }

    const startMs = Date.parse(body.start);
    if (Number.isNaN(startMs)) {
      return NextResponse.json(
        { error: "Invalid start datetime" },
        { status: 400 },
      );
    }

    const endResult = resolveCreateEndIso(body, startMs);
    if ("error" in endResult) return endResult.error;
    const { endIso } = endResult;

    const taskId =
      typeof body.taskId === "string" && body.taskId.trim()
        ? body.taskId.trim()
        : null;
    const task = taskId ? await getTask(taskId) : null;
    if (taskId && !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const prefs = await getCalendarPreferences();
    const calendarId =
      (typeof body.calendarId === "string" && body.calendarId) ||
      prefs.writable_calendar_id;
    if (!calendarId) {
      return NextResponse.json(
        {
          error:
            "書き込み先カレンダーが未設定です。Calendar 画面で書き込み先を選んでください",
        },
        { status: 400 },
      );
    }

    const writableCalendar = await assertCalendarIsWritable(calendarId);
    const summary =
      (typeof body.summary === "string" && body.summary.trim()) ||
      task?.title ||
      "(無題)";
    const description =
      (typeof body.description === "string" && body.description) ||
      (task
        ? [task.body_md?.trim() || null, `Workspace Task: ${task.id}`]
            .filter(Boolean)
            .join("\n\n")
        : undefined);

    const proposal = {
      calendarId: writableCalendar.id,
      calendarSummary: writableCalendar.summary,
      summary,
      description: description || null,
      start: new Date(startMs).toISOString(),
      end: endIso,
      taskId: task?.id ?? null,
      taskTitle: task?.title ?? null,
    };

    if (body.preview) {
      return NextResponse.json({ preview: true, proposal });
    }

    const created = await createGoogleWorkBlock({
      calendarId: writableCalendar.id,
      summary,
      description,
      startIso: proposal.start,
      endIso: proposal.end,
      timeZone: prefs.primary_timezone,
    });

    // Task なし = 単なる予定作成
    if (!task) {
      await logActivity({
        entityType: "calendar_event",
        entityId: created.id,
        action: "calendar_event_created",
        after: {
          google_calendar_id: created.calendarId,
          google_event_id: created.id,
          start: created.start,
          end: created.end,
          htmlLink: created.htmlLink,
        },
        actor: "user",
      });

      return NextResponse.json({
        preview: false,
        event: {
          id: created.id,
          calendarId: created.calendarId,
          calendarSummary: writableCalendar.summary,
          summary: created.summary,
          description: description ?? null,
          location: null,
          htmlLink: created.htmlLink,
          status: "confirmed",
          allDay: false,
          start: created.start,
          end: created.end,
          accessRole: writableCalendar.accessRole,
          readOnly: writableCalendar.readOnly,
          backgroundColor: writableCalendar.backgroundColor,
        },
      });
    }

    // Task あり = 作業枠としてリンクし、scheduled_* を更新
    const link = await upsertCalendarLink({
      taskId: task.id,
      projectId: task.project_id,
      googleCalendarId: created.calendarId,
      googleEventId: created.id,
    });

    let updatedTask = task;
    if (body.setScheduledDate !== false) {
      updatedTask = await updateTask(task.id, {
        scheduled_date: localDateKeyFromIso(proposal.start),
        scheduled_at: proposal.start,
      });
    }

    await logActivity({
      entityType: "task",
      entityId: task.id,
      action: "calendar_work_block_created",
      after: {
        google_calendar_id: created.calendarId,
        google_event_id: created.id,
        start: created.start,
        end: created.end,
        htmlLink: created.htmlLink,
        calendar_link_id: link.id,
      },
      actor: "user",
    });

    return NextResponse.json({
      preview: false,
      event: created,
      link,
      task: updatedTask,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create calendar event",
      },
      { status: 500 },
    );
  }
}

type UpdateBody = {
  calendarId?: string;
  eventId?: string;
  summary?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  description?: string | null;
  location?: string | null;
  timeZone?: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function PATCH(request: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    const writeAccess = await requireGoogleCalendarWriteAccess();
    if (writeAccess.error) return writeAccess.error;

    const body = (await request.json()) as UpdateBody;
    const calendarId =
      typeof body.calendarId === "string" ? body.calendarId.trim() : "";
    const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
    const summary =
      typeof body.summary === "string" ? body.summary.trim() : "";
    const start = typeof body.start === "string" ? body.start : "";
    const end = typeof body.end === "string" ? body.end : "";
    const allDay = body.allDay === true;

    if (!calendarId || !eventId) {
      return NextResponse.json(
        { error: "calendarId and eventId are required" },
        { status: 400 },
      );
    }
    if (!summary) {
      return NextResponse.json(
        { error: "タイトルを入力してください" },
        { status: 400 },
      );
    }

    if (allDay) {
      if (!ISO_DATE.test(start) || !ISO_DATE.test(end) || end <= start) {
        return NextResponse.json(
          { error: "終了日は開始日より後にしてください" },
          { status: 400 },
        );
      }
    } else {
      const startMs = Date.parse(start);
      const endMs = Date.parse(end);
      if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
        return NextResponse.json(
          { error: "終了日時は開始日時より後にしてください" },
          { status: 400 },
        );
      }
    }

    const timeZone =
      typeof body.timeZone === "string" && isValidTimeZone(body.timeZone)
        ? body.timeZone
        : undefined;
    const description =
      typeof body.description === "string" ? body.description : undefined;
    const location =
      typeof body.location === "string"
        ? body.location.trim() || null
        : undefined;
    const event = await updateGoogleEvent({
      calendarId,
      eventId,
      summary,
      start,
      end,
      allDay,
      ...(description !== undefined ? { description } : {}),
      ...(location !== undefined ? { location } : {}),
      timeZone,
    });

    await logActivity({
      entityType: "calendar_event",
      entityId: event.id,
      action: "calendar_event_updated",
      after: {
        google_calendar_id: event.calendarId,
        summary: event.summary,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        description: event.description,
        location: event.location,
      },
      actor: "user",
    });

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update calendar event",
      },
      { status: 500 },
    );
  }
}
