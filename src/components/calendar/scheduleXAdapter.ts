import type { CalendarEvent } from "@schedule-x/calendar";
import { eventKey, calendarKey } from "@/lib/workspace/calendar/colors";
import { formatHybridTimeRange } from "@/lib/workspace/calendar/time";
import { nowInTimeZone } from "@/lib/workspace/calendar/timezones";
import type { GoogleCalendarEvent } from "@/types/calendar";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function timedEventCustomContent(
  title: string,
  start: Temporal.ZonedDateTime,
  end: Temporal.ZonedDateTime,
  dayStartsHour: number,
): string {
  const range = formatHybridTimeRange(
    { hour: start.hour, minute: start.minute },
    { hour: end.hour, minute: end.minute },
    dayStartsHour,
  );
  return (
    `<div class="sx__time-grid-event-title">${escapeHtml(title)}</div>` +
    `<div class="sx__time-grid-event-time">${range}</div>`
  );
}

/**
 * Google 予定を schedule-x の CalendarEvent に変換する。
 * 終日は Google の排他的 end を inclusive に直し、時刻付きはハイブリッド表示用の HTML を付ける。
 */
export function toScheduleXEvent(
  event: GoogleCalendarEvent,
  timeZone: string,
  dayStartsHour: number,
): CalendarEvent | null {
  try {
    const id = eventKey(event.calendarId, event.id);
    const calendarId = calendarKey(event.calendarId);

    if (event.allDay) {
      const start = Temporal.PlainDate.from(event.start.slice(0, 10));
      // Google の終日 end は排他的（翌日 00:00）
      const rawEnd = Temporal.PlainDate.from(event.end.slice(0, 10));
      const end =
        Temporal.PlainDate.compare(rawEnd, start) > 0
          ? rawEnd.subtract({ days: 1 })
          : start;
      return {
        id,
        title: event.summary,
        start,
        end,
        calendarId,
        location: undefined,
        htmlLink: event.htmlLink,
      };
    }

    const start = Temporal.Instant.from(event.start).toZonedDateTimeISO(
      timeZone,
    );
    const end = Temporal.Instant.from(event.end).toZonedDateTimeISO(timeZone);
    return {
      id,
      title: event.summary,
      start,
      end,
      calendarId,
      location: undefined,
      htmlLink: event.htmlLink,
      // ロケールの AM/PM を避け、ハイブリッド 24h（例: 26:00 – 27:00）で出す
      _customContent: {
        timeGrid: timedEventCustomContent(
          event.summary || "",
          start,
          end,
          dayStartsHour,
        ),
      },
    };
  } catch {
    return null;
  }
}

/** グリッドを「今」の少し上から開くための初期スクロール時刻（HH:00）。 */
export function initialScrollTime(
  dayStartsHour = 0,
  timeZone: string,
): string {
  const { hour: nowHour, minute: nowMinute } = nowInTimeZone(timeZone);
  const absolute = nowHour * 60 + nowMinute - 120; // 2時間早め
  const dayStart = (((dayStartsHour % 24) + 24) % 24) * 60;
  const offset = (absolute - dayStart + 24 * 60) % (24 * 60);
  const hour = Math.floor(offset / 60);
  const clockHour = (dayStartsHour + hour) % 24;
  return `${String(clockHour).padStart(2, "0")}:00`;
}
