"use client";

import "temporal-polyfill/global";
import "@schedule-x/theme-default/dist/index.css";
import "./workspace-calendar.css";

import {
  type CalendarConfig,
  type CalendarEvent,
} from "@schedule-x/calendar";
import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { ScheduleXCalendar, useNextCalendarApp } from "@schedule-x/react";
import { createScrollControllerPlugin } from "@schedule-x/scroll-controller";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarHeaderExtras } from "@/components/calendar/CalendarHeaderExtras";
import type { CalendarEventAnchor } from "@/components/calendar/CalendarEventPopover";
import {
  dragCreateAnchor,
  gridOffsetFromInstant,
  IGNORE_CREATE_SELECTOR,
  INTERACT_SNAP_MINUTES,
  isNearBottomEdge,
  resolveCalendarGridPoint,
  SCHEDULE_LANE_WIDTH_PERCENT,
  CREATE_SNAP_MINUTES,
  SNAP_MINUTES,
  wallClockFromGrid,
  type CalendarCreateSlot,
  type DragCreateState,
  type TimedBlockMoveState,
  type TimedBlockResizeState,
} from "@/components/calendar/calendarGridPointer";
import {
  initialScrollTime,
  toScheduleXEvent,
} from "@/components/calendar/scheduleXAdapter";
import {
  TaskLane,
  type TaskLaneClickTarget,
  type TaskLaneMoveStart,
  type TaskLaneResizeStart,
} from "@/components/calendar/TaskLane";
import { TimezoneAxisHour } from "@/components/calendar/TimezoneAxisHour";
import { TimezoneAxisLabels } from "@/components/calendar/TimezoneAxisLabels";
import { useHybridCurrentTimeColumn } from "@/components/calendar/useHybridCurrentTimeColumn";
import { useTaskLaneHosts } from "@/components/calendar/useTaskLaneHosts";
import { cn } from "@/lib/cn";
import { cardOutlineClass } from "@/lib/site/card-styles";
import {
  calendarColors,
  calendarKey,
  eventKey,
} from "@/lib/workspace/calendar/colors";
import { layoutTaskLane } from "@/lib/workspace/calendar/lane";
import {
  toScheduleXDayBoundaries,
  toScheduleXFirstDay,
  type WeekStartsOn,
} from "@/lib/workspace/calendar/time";
import {
  DEFAULT_PRIMARY_LABEL,
  DEFAULT_PRIMARY_TIMEZONE,
  DEFAULT_SECONDARY_LABEL,
  DEFAULT_SECONDARY_TIMEZONE,
} from "@/lib/workspace/calendar/timezones";
import {
  createWorkspaceCalendarViews,
  patchSlidingMultiDayWeek,
  readStoredCalendarView,
  writeStoredCalendarView,
} from "@/lib/workspace/calendar/views";
import type {
  CalendarTaskBlock,
  GoogleCalendarEvent,
  GoogleCalendarListItem,
} from "@/types/calendar";

export type { CalendarCreateSlot };

const MOVE_ACTIVATION_PX = 6;

type Props = {
  events: GoogleCalendarEvent[];
  /** 右レーンに描画する作業枠（1 タスク複数可） */
  workBlocks?: CalendarTaskBlock[];
  calendars: GoogleCalendarListItem[];
  weekStartsOn?: WeekStartsOn;
  /** タイムグリッド上端の時（0–23） */
  dayStartsHour?: number;
  primaryTimezone?: string;
  primaryLabel?: string;
  secondaryTimezoneEnabled?: boolean;
  secondaryTimezone?: string;
  secondaryLabel?: string;
  onRangeChange?: (timeMin: string, timeMax: string) => void;
  /** サイドバーから Task をドラッグ中 */
  draggingTask?: boolean;
  onDropTask?: (taskId: string, start: Date) => void;
  /** 作業枠をタイムグリッド上で移動 */
  onMoveWorkBlock?: (workBlockId: string, start: Date) => void;
  /** 作業枠の終了時刻をリサイズ */
  onResizeWorkBlock?: (workBlockId: string, end: Date) => void;
  /** 予定を移動（書き込み可のとき） */
  onMoveEvent?: (
    event: GoogleCalendarEvent,
    start: Date,
    end: Date,
  ) => void;
  /** 予定の終了時刻をリサイズ */
  onResizeEvent?: (
    event: GoogleCalendarEvent,
    start: Date,
    end: Date,
  ) => void;
  onEventSelect?: (
    event: GoogleCalendarEvent,
    anchor: CalendarEventAnchor,
  ) => void;
  onCreateSlot?: (slot: CalendarCreateSlot) => void;
  /** false のとき左レーン（予定）のドラッグ作成を無効化 */
  canCreateSchedule?: boolean;
  onTaskSelect?: (target: TaskLaneClickTarget) => void;
  className?: string;
};

export function WorkspaceCalendar({
  events,
  workBlocks = [],
  calendars,
  weekStartsOn = "monday",
  dayStartsHour = 0,
  primaryTimezone = DEFAULT_PRIMARY_TIMEZONE,
  primaryLabel = DEFAULT_PRIMARY_LABEL,
  secondaryTimezoneEnabled = false,
  secondaryTimezone = DEFAULT_SECONDARY_TIMEZONE,
  secondaryLabel = DEFAULT_SECONDARY_LABEL,
  onRangeChange,
  draggingTask,
  onDropTask,
  onMoveWorkBlock,
  onResizeWorkBlock,
  onMoveEvent,
  onResizeEvent,
  onEventSelect,
  onCreateSlot,
  canCreateSchedule = true,
  onTaskSelect,
  className,
}: Props) {
  const timeZone = primaryTimezone;
  const [dropHint, setDropHint] = useState<string | null>(null);
  const [dragCreate, setDragCreate] = useState<DragCreateState | null>(null);
  const [blockMove, setBlockMove] = useState<TimedBlockMoveState | null>(null);
  const [blockResize, setBlockResize] =
    useState<TimedBlockResizeState | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const dragCreateRef = useRef<DragCreateState | null>(null);
  dragCreateRef.current = dragCreate;
  const blockMoveRef = useRef<TimedBlockMoveState | null>(null);
  blockMoveRef.current = blockMove;
  const blockResizeRef = useRef<TimedBlockResizeState | null>(null);
  blockResizeRef.current = blockResize;
  const suppressNextEventClickRef = useRef(false);
  const [visibleRange, setVisibleRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState(() =>
    Temporal.Now.plainDateISO(timeZone).toString(),
  );

  const onRangeChangeRef = useRef(onRangeChange);
  onRangeChangeRef.current = onRangeChange;
  const onEventSelectRef = useRef(onEventSelect);
  onEventSelectRef.current = onEventSelect;
  const googleEventsRef = useRef(events);
  googleEventsRef.current = events;

  const laneByDay = useMemo(
    () => layoutTaskLane(workBlocks, dayStartsHour),
    [workBlocks, dayStartsHour],
  );

  const scheduleXEvents = useMemo(
    () =>
      events
        .map((event) => toScheduleXEvent(event, timeZone, dayStartsHour))
        .filter((event): event is CalendarEvent => event !== null),
    [events, timeZone, dayStartsHour],
  );
  const scheduleXEventsRef = useRef(scheduleXEvents);
  scheduleXEventsRef.current = scheduleXEvents;

  const scheduleXCalendars = useMemo(() => {
    const map: NonNullable<CalendarConfig["calendars"]> = {};
    for (const calendar of calendars) {
      const colors = calendarColors(calendar.backgroundColor);
      map[calendarKey(calendar.id)] = {
        colorName: calendarKey(calendar.id),
        label: calendar.summary,
        lightColors: colors.light,
        darkColors: colors.dark,
      };
    }
    return map;
  }, [calendars]);

  const [eventsService] = useState(() => createEventsServicePlugin());
  const [calendarControls] = useState(() => createCalendarControlsPlugin());
  const [scrollController] = useState(() =>
    createScrollControllerPlugin({
      initialScroll: initialScrollTime(dayStartsHour, timeZone),
    }),
  );

  const customComponents = useMemo(
    () => ({
      weekGridHour: (props: {
        hour?: number;
        gridStep?: { hour: number; minute: number };
      }) => (
        <TimezoneAxisHour
          hour={props.gridStep?.hour ?? props.hour ?? 0}
          minute={props.gridStep?.minute ?? 0}
          dayStartsHour={dayStartsHour}
          primaryTimezone={primaryTimezone}
          secondaryTimezone={secondaryTimezone}
          secondaryEnabled={secondaryTimezoneEnabled}
        />
      ),
    }),
    [
      dayStartsHour,
      primaryTimezone,
      secondaryTimezone,
      secondaryTimezoneEnabled,
    ],
  );

  const views = useMemo(() => createWorkspaceCalendarViews(), []);
  // クライアント遷移時はここで復元。フルリロード時は SSR 後の effect でも再適用する
  const defaultView = useMemo(() => readStoredCalendarView(), []);

  const calendarApp = useNextCalendarApp(
    {
      views,
      defaultView,
      // ビュー名は英語（View / Day / 2 days / …）
      locale: "en-US",
      firstDayOfWeek: toScheduleXFirstDay(
        weekStartsOn,
      ) as CalendarConfig["firstDayOfWeek"],
      timezone: timeZone as CalendarConfig["timezone"],
      calendars: scheduleXCalendars,
      events: scheduleXEventsRef.current,
      dayBoundaries: toScheduleXDayBoundaries(dayStartsHour),
      // ~150px/時。eventWidth で右レーン（Task）の余白を確保する
      weekOptions: {
        eventOverlap: true,
        gridStep: 30,
        gridHeight: 3600,
        eventWidth: SCHEDULE_LANE_WIDTH_PERCENT,
        nDays: 7,
        // en-US でも 24h 軸（6:00…）を維持
        timeAxisFormatOptions: { hour: "numeric", hourCycle: "h23" },
      },
      callbacks: {
        onEventClick(event, nativeEvent) {
          if (suppressNextEventClickRef.current) {
            suppressNextEventClickRef.current = false;
            return;
          }
          const source = googleEventsRef.current.find(
            (item) => eventKey(item.calendarId, item.id) === String(event.id),
          );
          const target =
            nativeEvent.currentTarget instanceof HTMLElement
              ? nativeEvent.currentTarget
              : nativeEvent.target instanceof HTMLElement
                ? nativeEvent.target
                : null;
          if (!source || !target) return;
          const rect = target.getBoundingClientRect();
          onEventSelectRef.current?.(source, {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          });
        },
        onRangeUpdate(range) {
          const start = new Date(range.start.epochMilliseconds).toISOString();
          const end = new Date(range.end.epochMilliseconds).toISOString();
          setVisibleRange((previous) =>
            previous?.start === start && previous.end === end
              ? previous
              : { start, end },
          );
          onRangeChangeRef.current?.(start, end);
          // ビュー切替でも range が更新されるので、ここで選択中ビューを残す
          try {
            writeStoredCalendarView(calendarControls.getView());
          } catch {
            // プラグイン未接続時は無視
          }
        },
        onSelectedDateUpdate(date) {
          setSelectedDate(date.toString());
        },
      },
    },
    [eventsService, calendarControls, scrollController],
  );

  useEffect(() => {
    if (!calendarApp) return;
    eventsService.set(scheduleXEvents);
  }, [calendarApp, eventsService, scheduleXEvents]);

  useEffect(() => {
    if (!calendarApp) return;
    patchSlidingMultiDayWeek(calendarApp);
  }, [calendarApp]);

  // SSR 時は localStorage を読めないため、マウント後に保存済みビューへ合わせる
  useEffect(() => {
    if (!calendarApp) return;
    const savedView = readStoredCalendarView();
    try {
      if (calendarControls.getView() !== savedView) {
        calendarControls.setView(savedView);
      }
    } catch {
      // プラグイン未接続時は無視
    }
  }, [calendarApp, calendarControls]);

  // weekStartsOn / dayStartsHour は初回 create 時の config のみ。
  // 変更時は親が key でリマウントする（calendarControls は render 前だと不安全）。

  const laneHosts = useTaskLaneHosts(rootRef);
  useHybridCurrentTimeColumn(rootElement, dayStartsHour, timeZone);
  const onCreateSlotRef = useRef(onCreateSlot);
  onCreateSlotRef.current = onCreateSlot;
  const onMoveWorkBlockRef = useRef(onMoveWorkBlock);
  onMoveWorkBlockRef.current = onMoveWorkBlock;
  const onResizeWorkBlockRef = useRef(onResizeWorkBlock);
  onResizeWorkBlockRef.current = onResizeWorkBlock;
  const onMoveEventRef = useRef(onMoveEvent);
  onMoveEventRef.current = onMoveEvent;
  const onResizeEventRef = useRef(onResizeEvent);
  onResizeEventRef.current = onResizeEvent;
  const onTaskSelectRef = useRef(onTaskSelect);
  onTaskSelectRef.current = onTaskSelect;

  const resolveGridPoint = useCallback(
    (
      clientX: number,
      clientY: number,
      opts?: {
        lane?: DragCreateState["lane"];
        column?: HTMLElement;
        snapMinutes?: number;
      },
    ) =>
      resolveCalendarGridPoint(clientX, clientY, {
        dayStartsHour,
        timeZone,
        lane: opts?.lane,
        column: opts?.column,
        snapMinutes: opts?.snapMinutes,
      }),
    [dayStartsHour, timeZone],
  );

  const finishDragCreate = useCallback(
    (state: DragCreateState) => {
      const startOffset = Math.min(state.originOffset, state.currentOffset);
      let endOffset = Math.max(state.originOffset, state.currentOffset);
      if (endOffset <= startOffset) {
        endOffset = Math.min(24 * 60, startOffset + SNAP_MINUTES);
      }
      if (endOffset <= startOffset) return;

      const start = wallClockFromGrid(
        state.dateKey,
        startOffset,
        dayStartsHour,
        timeZone,
      );
      const end = wallClockFromGrid(
        state.dateKey,
        endOffset,
        dayStartsHour,
        timeZone,
      );
      if (!start || !end) return;

      onCreateSlotRef.current?.({
        lane: state.lane,
        start,
        end,
        anchor: dragCreateAnchor(state, startOffset, endOffset),
      });
    },
    [dayStartsHour, timeZone],
  );

  useEffect(() => {
    if (!dragCreate) return;

    function onMove(event: PointerEvent) {
      const current = dragCreateRef.current;
      if (!current || event.pointerId !== current.pointerId) return;
      const point = resolveGridPoint(event.clientX, event.clientY, {
        lane: current.lane,
        column: current.column,
      });
      if (!point) return;
      setDragCreate((previous) => {
        if (!previous) return previous;
        if (previous.currentOffset === point.offsetMinutes) return previous;
        return { ...previous, currentOffset: point.offsetMinutes };
      });
    }

    function onUp(event: PointerEvent) {
      const current = dragCreateRef.current;
      if (!current || event.pointerId !== current.pointerId) return;
      const point = resolveGridPoint(event.clientX, event.clientY, {
        lane: current.lane,
        column: current.column,
      });
      const finalState = point
        ? { ...current, currentOffset: point.offsetMinutes }
        : current;
      setDragCreate(null);
      finishDragCreate(finalState);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragCreate, finishDragCreate, resolveGridPoint]);

  useEffect(() => {
    if (!blockMove) return;

    function onMove(event: PointerEvent) {
      const current = blockMoveRef.current;
      if (!current || event.pointerId !== current.pointerId) return;

      const dx = event.clientX - current.originClientX;
      const dy = event.clientY - current.originClientY;
      const activated =
        current.active || Math.hypot(dx, dy) >= MOVE_ACTIVATION_PX;

      const point = resolveGridPoint(event.clientX, event.clientY, {
        lane: current.lane,
        snapMinutes: INTERACT_SNAP_MINUTES,
      });

      setBlockMove((previous) => {
        if (!previous || previous.pointerId !== event.pointerId) {
          return previous;
        }
        if (!activated) return previous;
        if (!point) {
          return previous.active ? previous : { ...previous, active: true };
        }
        if (
          previous.active &&
          previous.dateKey === point.dateKey &&
          previous.offsetMinutes === point.offsetMinutes
        ) {
          return previous;
        }
        return {
          ...previous,
          active: true,
          dateKey: point.dateKey,
          column: point.column,
          offsetMinutes: point.offsetMinutes,
          start: point.start,
        };
      });
    }

    function onUp(event: PointerEvent) {
      const current = blockMoveRef.current;
      if (!current || event.pointerId !== current.pointerId) return;

      const point = resolveGridPoint(event.clientX, event.clientY, {
        lane: current.lane,
        snapMinutes: INTERACT_SNAP_MINUTES,
      });
      const finalStart = point?.start ?? current.start;
      const wasActive = current.active && Boolean(finalStart);
      setBlockMove(null);

      if (current.kind === "event") {
        // 自分でクリック／移動を処理したので Schedule-X の onEventClick を抑止
        suppressNextEventClickRef.current = true;
      }

      if (wasActive && finalStart) {
        const finalEnd = new Date(finalStart.getTime() + current.durationMs);
        if (current.kind === "task" && current.workBlockId) {
          onMoveWorkBlockRef.current?.(current.workBlockId, finalStart);
        } else if (current.kind === "event" && current.eventId) {
          const source = googleEventsRef.current.find(
            (item) =>
              item.id === current.eventId &&
              item.calendarId === current.calendarId,
          );
          if (source) {
            onMoveEventRef.current?.(source, finalStart, finalEnd);
          }
        }
        return;
      }

      if (current.kind === "task" && current.workBlockId) {
        const block = workBlocks.find(
          (item) => item.workBlockId === current.workBlockId,
        );
        if (block) {
          onTaskSelectRef.current?.({
            taskId: block.taskId,
            workBlockId: block.workBlockId,
            start: block.start,
            end: block.end,
          });
        }
      } else if (current.kind === "event" && current.eventId) {
        const source = googleEventsRef.current.find(
          (item) =>
            item.id === current.eventId &&
            item.calendarId === current.calendarId,
        );
        if (source) {
          const el = document.querySelector<HTMLElement>(
            `[data-event-id="${CSS.escape(eventKey(source.calendarId, source.id))}"]`,
          );
          const rect = el?.getBoundingClientRect();
          if (rect) {
            onEventSelectRef.current?.(source, {
              top: rect.top,
              left: rect.left,
              right: rect.right,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height,
            });
          }
        }
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [blockMove, resolveGridPoint, workBlocks]);

  useEffect(() => {
    if (!blockResize) return;

    function onMove(event: PointerEvent) {
      const current = blockResizeRef.current;
      if (!current || event.pointerId !== current.pointerId) return;

      const dx = event.clientX - current.originClientX;
      const dy = event.clientY - current.originClientY;
      const activated =
        current.active || Math.hypot(dx, dy) >= MOVE_ACTIVATION_PX;

      const point = resolveGridPoint(event.clientX, event.clientY, {
        lane: current.lane,
        column: current.column,
        snapMinutes: INTERACT_SNAP_MINUTES,
      });
      if (!point) {
        if (activated && !current.active) {
          setBlockResize((previous) =>
            previous ? { ...previous, active: true } : previous,
          );
        }
        return;
      }

      const minEnd = current.startOffsetMinutes + INTERACT_SNAP_MINUTES;
      const endOffset = Math.max(
        minEnd,
        Math.min(24 * 60, point.offsetMinutes),
      );
      const end = wallClockFromGrid(
        current.dateKey,
        endOffset,
        dayStartsHour,
        timeZone,
      );

      setBlockResize((previous) => {
        if (!previous || previous.pointerId !== event.pointerId) {
          return previous;
        }
        if (!activated) return previous;
        if (
          previous.active &&
          previous.endOffsetMinutes === endOffset
        ) {
          return previous;
        }
        return {
          ...previous,
          active: true,
          endOffsetMinutes: endOffset,
          end,
        };
      });
    }

    function onUp(event: PointerEvent) {
      const current = blockResizeRef.current;
      if (!current || event.pointerId !== current.pointerId) return;

      const wasActive = current.active && Boolean(current.end);
      const finalEnd = current.end;
      setBlockResize(null);

      if (current.kind === "event") {
        suppressNextEventClickRef.current = true;
      }

      if (wasActive && finalEnd) {
        if (current.kind === "task" && current.workBlockId) {
          onResizeWorkBlockRef.current?.(current.workBlockId, finalEnd);
        } else if (current.kind === "event" && current.eventId) {
          const source = googleEventsRef.current.find(
            (item) =>
              item.id === current.eventId &&
              item.calendarId === current.calendarId,
          );
          if (source) {
            onResizeEventRef.current?.(
              source,
              current.startFixed,
              finalEnd,
            );
          }
        }
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [blockResize, dayStartsHour, resolveGridPoint, timeZone]);

  function handleTaskMoveStart(payload: TaskLaneMoveStart) {
    if (!onMoveWorkBlock) return;
    const durationMs =
      Date.parse(payload.block.end) - Date.parse(payload.block.start);
    if (!Number.isFinite(durationMs) || durationMs <= 0) return;
    setDragCreate(null);
    setBlockResize(null);
    setBlockMove({
      kind: "task",
      workBlockId: payload.block.workBlockId,
      taskId: payload.block.taskId,
      calendarId: null,
      eventId: null,
      durationMs,
      pointerId: payload.pointerId,
      originClientX: payload.clientX,
      originClientY: payload.clientY,
      active: false,
      dateKey: null,
      column: null,
      offsetMinutes: null,
      start: null,
      lane: "task",
    });
  }

  function handleTaskResizeStart(payload: TaskLaneResizeStart) {
    if (!onResizeWorkBlock) return;
    const startMs = Date.parse(payload.block.start);
    const endMs = Date.parse(payload.block.end);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return;
    }
    const startFixed = new Date(startMs);
    const placed = gridOffsetFromInstant(startFixed, dayStartsHour, timeZone);
    if (!placed) return;
    const column = document.querySelector<HTMLElement>(
      `[data-time-grid-date="${placed.dateKey}"]`,
    );
    if (!column) return;
    const endPlaced = gridOffsetFromInstant(
      new Date(endMs),
      dayStartsHour,
      timeZone,
    );
    setDragCreate(null);
    setBlockMove(null);
    setBlockResize({
      kind: "task",
      workBlockId: payload.block.workBlockId,
      taskId: payload.block.taskId,
      calendarId: null,
      eventId: null,
      startOffsetMinutes: placed.offsetMinutes,
      startFixed,
      dateKey: placed.dateKey,
      column,
      pointerId: payload.pointerId,
      originClientX: payload.clientX,
      originClientY: payload.clientY,
      active: false,
      endOffsetMinutes:
        endPlaced && endPlaced.dateKey === placed.dateKey
          ? endPlaced.offsetMinutes
          : placed.offsetMinutes + INTERACT_SNAP_MINUTES,
      end: new Date(endMs),
      lane: "task",
    });
  }

  // 予定（Schedule-X）の移動・下端リサイズ
  useEffect(() => {
    const root = rootElement;
    if (!root) return;
    const canInteract = Boolean(onMoveEvent || onResizeEvent);

    function onPointerDown(event: PointerEvent) {
      if (!canInteract || event.button !== 0) return;
      if (blockMoveRef.current || blockResizeRef.current || dragCreateRef.current) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const eventEl = target.closest<HTMLElement>(".sx__time-grid-event");
      if (!eventEl || eventEl.classList.contains("is-event-copy")) return;

      const sxEventId = eventEl.dataset.eventId;
      if (!sxEventId) return;

      const source = googleEventsRef.current.find(
        (item) => eventKey(item.calendarId, item.id) === sxEventId,
      );
      if (!source || source.allDay || source.readOnly) return;

      const startMs = Date.parse(source.start);
      const endMs = Date.parse(source.end);
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        return;
      }

      const resizeHandle = target.closest(".sx__time-grid-event-resize-handle");
      const wantResize =
        Boolean(onResizeEvent) &&
        (Boolean(resizeHandle) || isNearBottomEdge(event.clientY, eventEl));

      const column = eventEl.closest<HTMLElement>("[data-time-grid-date]");
      if (!column) return;

      event.preventDefault();
      event.stopPropagation();
      setDragCreate(null);

      if (wantResize) {
        const startFixed = new Date(startMs);
        const placed = gridOffsetFromInstant(
          startFixed,
          dayStartsHour,
          timeZone,
        );
        if (!placed) return;
        const endPlaced = gridOffsetFromInstant(
          new Date(endMs),
          dayStartsHour,
          timeZone,
        );
        setBlockMove(null);
        setBlockResize({
          kind: "event",
          workBlockId: null,
          taskId: null,
          calendarId: source.calendarId,
          eventId: source.id,
          startOffsetMinutes: placed.offsetMinutes,
          startFixed,
          dateKey: placed.dateKey,
          column,
          pointerId: event.pointerId,
          originClientX: event.clientX,
          originClientY: event.clientY,
          active: false,
          endOffsetMinutes:
            endPlaced && endPlaced.dateKey === placed.dateKey
              ? endPlaced.offsetMinutes
              : placed.offsetMinutes + INTERACT_SNAP_MINUTES,
          end: new Date(endMs),
          lane: "schedule",
        });
        return;
      }

      if (!onMoveEvent) return;
      setBlockResize(null);
      setBlockMove({
        kind: "event",
        workBlockId: null,
        taskId: null,
        calendarId: source.calendarId,
        eventId: source.id,
        durationMs: endMs - startMs,
        pointerId: event.pointerId,
        originClientX: event.clientX,
        originClientY: event.clientY,
        active: false,
        dateKey: null,
        column: null,
        offsetMinutes: null,
        start: null,
        lane: "schedule",
      });
    }

    root.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      root.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [
    rootElement,
    onMoveEvent,
    onResizeEvent,
    dayStartsHour,
    timeZone,
  ]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!onCreateSlot || draggingTask || event.button !== 0) return;
    if (blockMove || blockResize) return;
    const target = event.target as HTMLElement | null;
    if (!target || target.closest(IGNORE_CREATE_SELECTOR)) return;

    const point = resolveGridPoint(event.clientX, event.clientY, {
      snapMinutes: CREATE_SNAP_MINUTES,
    });
    if (!point) return;
    if (point.lane === "schedule" && !canCreateSchedule) return;

    event.preventDefault();
    setDragCreate({
      lane: point.lane,
      dateKey: point.dateKey,
      column: point.column,
      originOffset: point.offsetMinutes,
      currentOffset: point.offsetMinutes,
      pointerId: event.pointerId,
    });
  }

  const createGhost =
    dragCreate &&
    (() => {
      const startOffset = Math.min(
        dragCreate.originOffset,
        dragCreate.currentOffset,
      );
      let endOffset = Math.max(
        dragCreate.originOffset,
        dragCreate.currentOffset,
      );
      if (endOffset <= startOffset) endOffset = startOffset + SNAP_MINUTES;
      const topPct = (startOffset / (24 * 60)) * 100;
      const heightPct = ((endOffset - startOffset) / (24 * 60)) * 100;
      return createPortal(
        <div
          className={cn(
            "sx-create-ghost",
            dragCreate.lane === "task"
              ? "sx-create-ghost--task"
              : "sx-create-ghost--schedule",
          )}
          style={{
            top: `${topPct}%`,
            height: `${Math.max(heightPct, 1.2)}%`,
          }}
        />,
        dragCreate.column,
      );
    })();

  const moveGhost =
    blockMove?.active &&
    blockMove.column &&
    blockMove.offsetMinutes != null
      ? (() => {
          const startOffset = blockMove.offsetMinutes;
          const durationMinutes = Math.max(
            INTERACT_SNAP_MINUTES,
            Math.round(blockMove.durationMs / 60_000),
          );
          const endOffset = Math.min(24 * 60, startOffset + durationMinutes);
          const topPct = (startOffset / (24 * 60)) * 100;
          const heightPct = ((endOffset - startOffset) / (24 * 60)) * 100;
          return createPortal(
            <div
              className={cn(
                "sx-create-ghost",
                "sx-create-ghost--moving",
                blockMove.lane === "task"
                  ? "sx-create-ghost--task"
                  : "sx-create-ghost--schedule",
              )}
              style={{
                top: `${topPct}%`,
                height: `${Math.max(heightPct, 1.2)}%`,
              }}
            />,
            blockMove.column,
          );
        })()
      : null;

  const resizeGhost =
    blockResize?.active && blockResize.column
      ? (() => {
          const startOffset = blockResize.startOffsetMinutes;
          const endOffset = Math.max(
            startOffset + INTERACT_SNAP_MINUTES,
            blockResize.endOffsetMinutes,
          );
          const topPct = (startOffset / (24 * 60)) * 100;
          const heightPct = ((endOffset - startOffset) / (24 * 60)) * 100;
          return createPortal(
            <div
              className={cn(
                "sx-create-ghost",
                "sx-create-ghost--moving",
                blockResize.lane === "task"
                  ? "sx-create-ghost--task"
                  : "sx-create-ghost--schedule",
              )}
              style={{
                top: `${topPct}%`,
                height: `${Math.max(heightPct, 1.2)}%`,
              }}
            />,
            blockResize.column,
          );
        })()
      : null;

  const interactingBlockId =
    (blockMove?.active &&
      (blockMove.kind === "task"
        ? blockMove.workBlockId
        : blockMove.eventId
          ? eventKey(blockMove.calendarId ?? "", blockMove.eventId)
          : null)) ||
    (blockResize?.active &&
      (blockResize.kind === "task"
        ? blockResize.workBlockId
        : blockResize.eventId
          ? eventKey(blockResize.calendarId ?? "", blockResize.eventId)
          : null)) ||
    null;

  useEffect(() => {
    if (!interactingBlockId) return;
    const selector =
      blockMove?.kind === "event" || blockResize?.kind === "event"
        ? `[data-event-id="${CSS.escape(interactingBlockId)}"]`
        : null;
    if (!selector) return;
    const el = document.querySelector(selector);
    el?.classList.add("sx__time-grid-event--moving");
    return () => {
      el?.classList.remove("sx__time-grid-event--moving");
    };
  }, [interactingBlockId, blockMove?.kind, blockResize?.kind]);

  return (
    <div
      ref={(element) => {
        rootRef.current = element;
        setRootElement((previous) =>
          previous === element ? previous : element,
        );
      }}
      className={cn(
        "workspace-calendar flex min-h-0 flex-col overflow-hidden rounded-lg bg-card",
        cardOutlineClass,
        secondaryTimezoneEnabled && "workspace-calendar--dual-tz",
        draggingTask && "ring-2 ring-brand/40",
        dragCreate && "workspace-calendar--creating",
        blockMove?.active && "workspace-calendar--moving-block",
        blockResize?.active && "workspace-calendar--resizing-block",
        className,
      )}
      style={
        {
          "--sx-schedule-lane": `${SCHEDULE_LANE_WIDTH_PERCENT}%`,
        } as React.CSSProperties
      }
      onPointerDown={handlePointerDown}
      onDragOver={(event) => {
        if (!onDropTask) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        const point = resolveGridPoint(event.clientX, event.clientY);
        if (!point || point.lane !== "task") {
          setDropHint("右側のタスク列へドロップ");
          return;
        }
        const zoned = Temporal.Instant.fromEpochMilliseconds(
          point.start.getTime(),
        ).toZonedDateTimeISO(timeZone);
        setDropHint(
          `${zoned.month}/${zoned.day} ${String(zoned.hour).padStart(2, "0")}:${String(zoned.minute).padStart(2, "0")} に配置`,
        );
      }}
      onDragLeave={() => setDropHint(null)}
      onDrop={(event) => {
        if (!onDropTask) return;
        const taskId = event.dataTransfer.getData(
          "application/x-workspace-task",
        );
        setDropHint(null);
        if (!taskId) return;
        event.preventDefault();
        const point = resolveGridPoint(event.clientX, event.clientY);
        if (!point || point.lane !== "task") return;
        onDropTask(taskId, point.start);
      }}
    >
      {dropHint ? (
        <p className="m-0 shrink-0 border-b border-border bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-foreground">
          {dropHint}
        </p>
      ) : null}
      <div className="relative min-h-0 flex-1">
        <ScheduleXCalendar
          calendarApp={calendarApp}
          customComponents={customComponents}
        />
      </div>
      {createGhost}
      {moveGhost}
      {resizeGhost}
      <CalendarHeaderExtras
        root={rootElement}
        rangeStart={visibleRange?.start ?? null}
        rangeEnd={visibleRange?.end ?? null}
        date={selectedDate}
        onDateChange={(value) => {
          try {
            calendarControls.setDate(Temporal.PlainDate.from(value));
          } catch {
            // ネイティブ date picker の不正入力は無視
          }
        }}
        timeZone={timeZone}
      />
      <TimezoneAxisLabels
        root={rootElement}
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        secondaryEnabled={secondaryTimezoneEnabled}
      />
      {laneHosts.map(({ dateKey, host, hostId }) => {
        const placed = laneByDay.get(dateKey);
        return placed?.length
          ? createPortal(
              <TaskLane
                placed={placed}
                dayStartsHour={dayStartsHour}
                onTaskClick={onTaskSelect}
                onTaskMoveStart={
                  onMoveWorkBlock ? handleTaskMoveStart : undefined
                }
                onTaskResizeStart={
                  onResizeWorkBlock ? handleTaskResizeStart : undefined
                }
                movingWorkBlockId={
                  blockMove?.active && blockMove.kind === "task"
                    ? blockMove.workBlockId
                    : blockResize?.active && blockResize.kind === "task"
                      ? blockResize.workBlockId
                      : null
                }
              />,
              host,
              hostId,
            )
          : null;
      })}
    </div>
  );
}

