import type { CalendarEventAnchor } from "@/components/calendar/CalendarEventPopover";
import type { CalendarCreateLane } from "@/components/calendar/CalendarSlotCreatePopover";
import {
  absoluteMinutesFromDayOffset,
  minutesFromDayStart,
} from "@/lib/workspace/calendar/time";
import { wallClockDate } from "@/lib/workspace/calendar/timezones";

/** 空き枠ドラッグ作成のスナップ（分） */
export const CREATE_SNAP_MINUTES = 30;
/** 移動・リサイズのスナップ（Google カレンダー同様 15 分） */
export const INTERACT_SNAP_MINUTES = 15;
/** @deprecated CREATE_SNAP_MINUTES を使う */
export const SNAP_MINUTES = CREATE_SNAP_MINUTES;

/** 下端リサイズ判定のヒット領域（px） */
export const RESIZE_EDGE_PX = 10;

/** 1日列のうち左側（予定レーン）が占める幅の割合。 */
export const SCHEDULE_LANE_WIDTH_PERCENT = 58;

export type CalendarGridPoint = {
  lane: CalendarCreateLane;
  dateKey: string;
  column: HTMLElement;
  /** 日グリッド上端からの分（0–1440）。 */
  offsetMinutes: number;
  start: Date;
};

export type DragCreateState = {
  lane: CalendarCreateLane;
  dateKey: string;
  column: HTMLElement;
  originOffset: number;
  currentOffset: number;
  pointerId: number;
};

/** タイムグリッド上の作業枠／予定を移動するときの状態。 */
export type TimedBlockMoveState = {
  kind: "task" | "event";
  workBlockId: string | null;
  taskId: string | null;
  calendarId: string | null;
  eventId: string | null;
  /** 元の枠の長さ（ミリ秒）。移動先でも維持する。 */
  durationMs: number;
  pointerId: number;
  originClientX: number;
  originClientY: number;
  /** 閾値を超えて実際に移動中か。false のあいだはクリック扱い。 */
  active: boolean;
  dateKey: string | null;
  column: HTMLElement | null;
  offsetMinutes: number | null;
  start: Date | null;
  lane: CalendarCreateLane;
};

/** 下端ドラッグで終了時刻だけ変えるときの状態。 */
export type TimedBlockResizeState = {
  kind: "task" | "event";
  workBlockId: string | null;
  taskId: string | null;
  calendarId: string | null;
  eventId: string | null;
  /** 固定する開始オフセット（日グリッド上端から分） */
  startOffsetMinutes: number;
  /** 固定する開始 Date */
  startFixed: Date;
  dateKey: string;
  column: HTMLElement;
  pointerId: number;
  originClientX: number;
  originClientY: number;
  active: boolean;
  endOffsetMinutes: number;
  end: Date | null;
  lane: CalendarCreateLane;
};

export type CalendarCreateSlot = {
  lane: CalendarCreateLane;
  start: Date;
  end: Date;
  anchor: CalendarEventAnchor;
};

/** ドラッグ作成を始めない要素（既存イベント・UI 操作など）。 */
export const IGNORE_CREATE_SELECTOR = [
  ".sx__time-grid-event",
  ".sx__date-grid-event",
  ".sx__month-grid-event",
  ".sx-task-lane__chip",
  ".sx__calendar-header",
  "button",
  "a",
  "input",
  "textarea",
  "select",
].join(",");

export function snapOffsetMinutes(
  ratio: number,
  snapMinutes: number = CREATE_SNAP_MINUTES,
): number {
  const snap = Math.max(1, snapMinutes);
  const raw = Math.min(Math.max(ratio, 0), 0.999) * 24 * 60;
  return Math.round(raw / snap) * snap;
}

export function snapMinutesValue(
  minutes: number,
  snapMinutes: number = INTERACT_SNAP_MINUTES,
): number {
  const snap = Math.max(1, snapMinutes);
  return Math.round(minutes / snap) * snap;
}

/**
 * インスタントをハイブリッド日の dateKey + グリッドオフセットに変換する。
 */
export function gridOffsetFromInstant(
  instant: Date,
  dayStartsHour: number,
  timeZone: string,
): { dateKey: string; offsetMinutes: number } | null {
  try {
    const zoned = Temporal.Instant.fromEpochMilliseconds(
      instant.getTime(),
    ).toZonedDateTimeISO(timeZone);
    const absoluteMinutes = zoned.hour * 60 + zoned.minute;
    const offsetMinutes = minutesFromDayStart(absoluteMinutes, dayStartsHour);
    const dayStart = ((dayStartsHour % 24) + 24) % 24;
    let plain = zoned.toPlainDate();
    if (dayStart !== 0 && zoned.hour < dayStart) {
      plain = plain.subtract({ days: 1 });
    }
    return { dateKey: plain.toString(), offsetMinutes };
  } catch {
    return null;
  }
}

/**
 * グリッド上のオフセット分を、プライマリ TZ の壁時計 Date に変換する。
 * ハイブリッド日（dayStartsHour 始まり）では、開始時刻より前の時刻は翌日扱い。
 */
export function wallClockFromGrid(
  dateKey: string,
  offsetMinutes: number,
  dayStartsHour: number,
  timeZone: string,
): Date | null {
  const absoluteMinutes = absoluteMinutesFromDayOffset(
    offsetMinutes,
    dayStartsHour,
  );
  const [yearPart, monthPart, dayPart] = dateKey.split("-").map(Number);
  if (!yearPart || !monthPart || !dayPart) return null;

  const hour = Math.floor(absoluteMinutes / 60);
  const minute = absoluteMinutes % 60;
  const dayStart = ((dayStartsHour % 24) + 24) % 24;

  let year = yearPart;
  let month = monthPart;
  let day = dayPart;
  if (dayStart !== 0 && hour < dayStart) {
    const next = Temporal.PlainDate.from({
      year: yearPart,
      month: monthPart,
      day: dayPart,
    }).add({ days: 1 });
    year = next.year;
    month = next.month;
    day = next.day;
  }

  return wallClockDate(year, month, day, hour, minute, timeZone);
}

export function resolveCalendarGridPoint(
  clientX: number,
  clientY: number,
  options: {
    dayStartsHour: number;
    timeZone: string;
    lane?: CalendarCreateLane;
    column?: HTMLElement;
    snapMinutes?: number;
  },
): CalendarGridPoint | null {
  const column =
    options.column ??
    document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>("[data-time-grid-date]");
  if (!column) return null;

  const dateKey = column.dataset.timeGridDate;
  if (!dateKey) return null;

  const rect = column.getBoundingClientRect();
  if (rect.height <= 0 || rect.width <= 0) return null;

  const xRatio = (clientX - rect.left) / rect.width;
  const lane: CalendarCreateLane =
    options.lane ??
    (xRatio < SCHEDULE_LANE_WIDTH_PERCENT / 100 ? "schedule" : "task");

  const offsetMinutes = snapOffsetMinutes(
    (clientY - rect.top) / rect.height,
    options.snapMinutes ?? CREATE_SNAP_MINUTES,
  );
  const start = wallClockFromGrid(
    dateKey,
    offsetMinutes,
    options.dayStartsHour,
    options.timeZone,
  );
  if (!start) return null;

  return { lane, dateKey, column, offsetMinutes, start };
}

/** 要素下端付近か（リサイズ開始判定）。 */
export function isNearBottomEdge(
  clientY: number,
  element: HTMLElement,
  edgePx: number = RESIZE_EDGE_PX,
): boolean {
  const rect = element.getBoundingClientRect();
  return clientY >= rect.bottom - edgePx && clientY <= rect.bottom + 2;
}

/** ドラッグ作成終了時に、ゴースト矩形をポップオーバーの anchor にする。 */
export function dragCreateAnchor(
  state: DragCreateState,
  startOffset: number,
  endOffset: number,
): CalendarEventAnchor {
  const rect = state.column.getBoundingClientRect();
  const laneLeft =
    state.lane === "schedule"
      ? rect.left
      : rect.left + (rect.width * SCHEDULE_LANE_WIDTH_PERCENT) / 100;
  const laneWidth =
    state.lane === "schedule"
      ? (rect.width * SCHEDULE_LANE_WIDTH_PERCENT) / 100
      : rect.width * (1 - SCHEDULE_LANE_WIDTH_PERCENT / 100);
  const topPct = startOffset / (24 * 60);
  const heightPct = (endOffset - startOffset) / (24 * 60);
  const ghostTop = rect.top + topPct * rect.height;
  const ghostHeight = Math.max(heightPct * rect.height, 8);

  return {
    top: ghostTop,
    left: laneLeft,
    right: laneLeft + laneWidth,
    bottom: ghostTop + ghostHeight,
    width: laneWidth,
    height: ghostHeight,
  };
}
