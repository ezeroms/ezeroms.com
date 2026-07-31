"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CalendarOptionsValues } from "@/components/calendar/CalendarOptionsModal";
import type {
  CalendarEventAnchor,
  CalendarEventEditValues,
} from "@/components/calendar/CalendarEventPopover";
import type { CalendarSlotDraft } from "@/components/calendar/CalendarSlotCreatePopover";
import type { CalendarCreateSlot } from "@/components/calendar/WorkspaceCalendar";
import { localDateKey, type WeekStartsOn } from "@/lib/workspace/calendar/time";
import type {
  GoogleCalendarEvent,
  GoogleCalendarListItem,
} from "@/types/calendar";
import { DEFAULT_TASK_MINUTES } from "@/types/calendar";
import type { CalendarActivityLink } from "@/types/friends";
import type { WorkspaceTask } from "@/types/workspace";

const SIDEBAR_STORAGE_KEY = "workspace.calendar.tasksSidebarOpen";

export type CalendarBoardControllerInput = {
  calendars: GoogleCalendarListItem[];
  hiddenCalendarIds: string[];
  writableCalendarId: string | null;
  weekStartsOn: WeekStartsOn;
  dayStartsHour: number;
  primaryTimezone: string;
  primaryLabel: string;
  secondaryTimezoneEnabled: boolean;
  secondaryTimezone: string;
  secondaryLabel: string;
  canWrite: boolean;
  events: GoogleCalendarEvent[];
  placedTasks: WorkspaceTask[];
  unscheduledTasks: WorkspaceTask[];
};

/**
 * CalendarBoard の状態・API 呼び出し・楽観更新をまとめる。
 * UI は CalendarBoard.tsx 側に残し、ここでは振る舞いだけを扱う。
 */
export function useCalendarBoardController(input: CalendarBoardControllerInput) {
  const router = useRouter();

  const [hiddenCalendarIds, setHiddenCalendarIds] = useState(
    () => new Set(input.hiddenCalendarIds),
  );
  const [writableCalendarId, setWritableCalendarId] = useState(
    input.writableCalendarId,
  );
  const [weekStartsOn, setWeekStartsOn] = useState(input.weekStartsOn);
  const [dayStartsHour, setDayStartsHour] = useState(input.dayStartsHour);
  const [primaryTimezone, setPrimaryTimezone] = useState(input.primaryTimezone);
  const [primaryLabel, setPrimaryLabel] = useState(input.primaryLabel);
  const [secondaryTimezoneEnabled, setSecondaryTimezoneEnabled] = useState(
    input.secondaryTimezoneEnabled,
  );
  const [secondaryTimezone, setSecondaryTimezone] = useState(
    input.secondaryTimezone,
  );
  const [secondaryLabel, setSecondaryLabel] = useState(input.secondaryLabel);

  const [events, setEvents] = useState(input.events);
  const [placedTasks, setPlacedTasks] = useState(input.placedTasks);
  const [unscheduledTasks, setUnscheduledTasks] = useState(
    input.unscheduledTasks,
  );
  const [activityLinks, setActivityLinks] = useState<CalendarActivityLink[]>(
    [],
  );

  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [visibleRange, setVisibleRange] = useState<{
    timeMin: string;
    timeMax: string;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{
    event: GoogleCalendarEvent;
    anchor: CalendarEventAnchor;
  } | null>(null);
  const [createDraft, setCreateDraft] = useState<CalendarSlotDraft | null>(
    null,
  );
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === "0") setSidebarOpen(false);
      if (saved === "1") setSidebarOpen(true);
    } catch {
      // localStorage 不可環境では既定の開いたままを使う
    }
  }, []);

  function setSidebar(open: boolean) {
    setSidebarOpen(open);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, open ? "1" : "0");
    } catch {
      // 永続化失敗は無視（セッション内の開閉は維持）
    }
  }

  const writableCalendars = useMemo(
    () => input.calendars.filter((calendar) => !calendar.readOnly),
    [input.calendars],
  );

  const visibleEvents = useMemo(
    () => events.filter((event) => !hiddenCalendarIds.has(event.calendarId)),
    [events, hiddenCalendarIds],
  );

  const optionsInitial = useMemo<CalendarOptionsValues>(
    () => ({
      hiddenCalendarIds: [...hiddenCalendarIds],
      weekStartsOn,
      dayStartsHour,
      writableCalendarId,
      primaryTimezone,
      primaryLabel,
      secondaryTimezoneEnabled,
      secondaryTimezone,
      secondaryLabel,
    }),
    [
      hiddenCalendarIds,
      weekStartsOn,
      dayStartsHour,
      writableCalendarId,
      primaryTimezone,
      primaryLabel,
      secondaryTimezoneEnabled,
      secondaryTimezone,
      secondaryLabel,
    ],
  );

  const loadPlacedTasks = useCallback(
    async (timeMin: string, timeMax: string) => {
      const params = new URLSearchParams({
        scheduled_at_from: timeMin,
        scheduled_at_to: timeMax,
        limit: "200",
      });
      const response = await fetch(`/api/admin/workspace/tasks/?${params}`);
      const data = (await response.json()) as {
        items?: WorkspaceTask[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "タスクの取得に失敗しました");
      }
      setPlacedTasks(data.items ?? []);
    },
    [],
  );

  const loadRange = useCallback(
    async (timeMin: string, timeMax: string, opts?: { refresh?: boolean }) => {
      setIsBusy(true);
      setErrorMessage(null);
      try {
        const params = new URLSearchParams({ timeMin, timeMax });
        if (opts?.refresh) params.set("refresh", "1");
        const [eventsResponse] = await Promise.all([
          fetch(`/api/admin/workspace/calendar/events/?${params}`),
          loadPlacedTasks(timeMin, timeMax),
        ]);
        const data = (await eventsResponse.json()) as {
          events?: GoogleCalendarEvent[];
          activityLinks?: CalendarActivityLink[];
          error?: string;
        };
        if (!eventsResponse.ok) {
          throw new Error(data.error || "予定の取得に失敗しました");
        }
        setEvents(data.events ?? []);
        setActivityLinks(data.activityLinks ?? []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "予定の取得に失敗しました",
        );
      } finally {
        setIsBusy(false);
      }
    },
    [loadPlacedTasks],
  );

  const handleRangeChange = useCallback(
    (timeMin: string, timeMax: string) => {
      setVisibleRange({ timeMin, timeMax });
      void loadRange(timeMin, timeMax);
    },
    [loadRange],
  );

  async function refresh() {
    if (visibleRange) {
      await loadRange(visibleRange.timeMin, visibleRange.timeMax, {
        refresh: true,
      });
    }
    router.refresh();
  }

  async function saveOptions(next: CalendarOptionsValues) {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const response = await fetch(
        "/api/admin/workspace/calendar/calendars/",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hiddenCalendarIds: next.hiddenCalendarIds,
            weekStartsOn: next.weekStartsOn,
            dayStartsHour: next.dayStartsHour,
            writableCalendarId: next.writableCalendarId,
            primaryTimezone: next.primaryTimezone,
            primaryLabel: next.primaryLabel,
            secondaryTimezoneEnabled: next.secondaryTimezoneEnabled,
            secondaryTimezone: next.secondaryTimezone,
            secondaryLabel: next.secondaryLabel,
          }),
        },
      );
      const data = (await response.json()) as {
        hiddenCalendarIds?: string[];
        weekStartsOn?: WeekStartsOn;
        dayStartsHour?: number;
        writableCalendarId?: string | null;
        primaryTimezone?: string;
        primaryLabel?: string;
        secondaryTimezoneEnabled?: boolean;
        secondaryTimezone?: string;
        secondaryLabel?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "設定の保存に失敗しました");
      }

      setHiddenCalendarIds(
        new Set(data.hiddenCalendarIds ?? next.hiddenCalendarIds),
      );
      setWeekStartsOn(data.weekStartsOn ?? next.weekStartsOn);
      setDayStartsHour(data.dayStartsHour ?? next.dayStartsHour);
      setWritableCalendarId(
        data.writableCalendarId !== undefined
          ? data.writableCalendarId
          : next.writableCalendarId,
      );
      setPrimaryTimezone(data.primaryTimezone ?? next.primaryTimezone);
      setPrimaryLabel(data.primaryLabel ?? next.primaryLabel);
      setSecondaryTimezoneEnabled(
        data.secondaryTimezoneEnabled ?? next.secondaryTimezoneEnabled,
      );
      setSecondaryTimezone(data.secondaryTimezone ?? next.secondaryTimezone);
      setSecondaryLabel(data.secondaryLabel ?? next.secondaryLabel);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "設定の保存に失敗しました",
      );
      throw error;
    } finally {
      setIsBusy(false);
    }
  }

  async function disconnectGoogleCalendar() {
    if (!confirm("Googleカレンダー連携を解除しますか？")) return;
    setIsBusy(true);
    setErrorMessage(null);
    setOptionsOpen(false);
    try {
      const response = await fetch(
        "/api/admin/workspace/calendar/oauth/disconnect/",
        { method: "POST" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "解除に失敗しました");
      }
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "解除に失敗しました",
      );
      setIsBusy(false);
    }
  }

  async function handleDropTask(taskId: string, start: Date) {
    setDraggingTaskId(null);
    const task =
      unscheduledTasks.find((item) => item.id === taskId) ??
      placedTasks.find((item) => item.id === taskId);
    if (!task) return;

    const estimatedMinutes =
      task.estimated_minutes && task.estimated_minutes > 0
        ? task.estimated_minutes
        : DEFAULT_TASK_MINUTES;
    const scheduledAt = start.toISOString();
    const scheduledDate = localDateKey(start);

    // 失敗時に戻せるよう、楽観更新前の一覧を保持する
    const previousUnscheduled = unscheduledTasks;
    const previousPlaced = placedTasks;
    const nextTask: WorkspaceTask = {
      ...task,
      scheduled_at: scheduledAt,
      scheduled_date: scheduledDate,
      estimated_minutes: estimatedMinutes,
    };
    setUnscheduledTasks((list) => list.filter((item) => item.id !== taskId));
    setPlacedTasks((list) => {
      const without = list.filter((item) => item.id !== taskId);
      return [...without, nextTask];
    });

    setIsBusy(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/admin/workspace/tasks/${taskId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduled_at: scheduledAt,
          scheduled_date: scheduledDate,
          estimated_minutes: estimatedMinutes,
        }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceTask;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "タスクの配置に失敗しました");
      }
      if (data.item) {
        setPlacedTasks((list) =>
          list.map((item) => (item.id === taskId ? data.item! : item)),
        );
      }
    } catch (error) {
      setUnscheduledTasks(previousUnscheduled);
      setPlacedTasks(previousPlaced);
      setErrorMessage(
        error instanceof Error ? error.message : "タスクの配置に失敗しました",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function saveCalendarEvent(values: CalendarEventEditValues) {
    if (!selectedEvent) return;
    const current = selectedEvent.event;
    const response = await fetch("/api/admin/workspace/calendar/events/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calendarId: current.calendarId,
        eventId: current.id,
        summary: values.summary,
        start: values.start,
        end: values.end,
        allDay: values.allDay,
        description: values.description,
        location: values.location,
        timeZone: primaryTimezone,
      }),
    });
    const data = (await response.json()) as {
      event?: GoogleCalendarEvent;
      error?: string;
    };
    if (!response.ok || !data.event) {
      throw new Error(data.error || "予定の保存に失敗しました");
    }

    setEvents((items) =>
      items.map((item) =>
        item.id === current.id && item.calendarId === current.calendarId
          ? data.event!
          : item,
      ),
    );
    setSelectedEvent(null);
    if (visibleRange) {
      await loadRange(visibleRange.timeMin, visibleRange.timeMax, {
        refresh: true,
      });
    }
  }

  const editingTask = useMemo(() => {
    if (!editingTaskId) return null;
    return (
      placedTasks.find((task) => task.id === editingTaskId) ??
      unscheduledTasks.find((task) => task.id === editingTaskId) ??
      null
    );
  }, [editingTaskId, placedTasks, unscheduledTasks]);

  function handleTaskSaved(task: WorkspaceTask) {
    setPlacedTasks((list) => {
      const exists = list.some((item) => item.id === task.id);
      if (!task.scheduled_at) {
        return list.filter((item) => item.id !== task.id);
      }
      if (exists) {
        return list.map((item) => (item.id === task.id ? task : item));
      }
      return [...list, task];
    });
    setUnscheduledTasks((list) => {
      if (task.scheduled_at) {
        return list.filter((item) => item.id !== task.id);
      }
      const exists = list.some((item) => item.id === task.id);
      if (exists) {
        return list.map((item) => (item.id === task.id ? task : item));
      }
      return list;
    });
    setEditingTaskId(null);
  }

  function handleTaskArchived(taskId: string) {
    setPlacedTasks((list) => list.filter((item) => item.id !== taskId));
    setUnscheduledTasks((list) => list.filter((item) => item.id !== taskId));
    setEditingTaskId(null);
  }

  function openCreateSlot(slot: CalendarCreateSlot) {
    setSelectedEvent(null);
    setEditingTaskId(null);
    setCreateDraft({
      lane: slot.lane,
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      anchor: slot.anchor,
    });
  }

  async function createFromSlot(values: {
    title: string;
    start: string;
    end: string;
  }) {
    if (!createDraft) return;
    const startMs = Date.parse(values.start);
    const endMs = Date.parse(values.end);
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      throw new Error("終了日時は開始日時より後にしてください");
    }

    if (createDraft.lane === "task") {
      const minutes = Math.max(
        DEFAULT_TASK_MINUTES,
        Math.round((endMs - startMs) / 60_000),
      );
      const response = await fetch("/api/admin/workspace/tasks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          status: "inbox",
          scheduled_at: values.start,
          scheduled_date: localDateKey(new Date(startMs)),
          estimated_minutes: minutes,
        }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceTask;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "タスクの作成に失敗しました");
      }
      setPlacedTasks((list) => [...list, data.item!]);
      setCreateDraft(null);
      return;
    }

    if (!input.canWrite) {
      throw new Error(
        "書き込み権限がありません。カレンダー連携を再接続してください",
      );
    }
    if (!writableCalendarId) {
      throw new Error(
        "書き込み先カレンダーが未設定です。カレンダーオプションで選んでください",
      );
    }

    const response = await fetch("/api/admin/workspace/calendar/events/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: values.title,
        start: values.start,
        end: values.end,
        calendarId: writableCalendarId,
      }),
    });
    const data = (await response.json()) as {
      event?: GoogleCalendarEvent;
      error?: string;
    };
    if (!response.ok || !data.event) {
      throw new Error(data.error || "予定の作成に失敗しました");
    }
    setEvents((items) =>
      [...items, data.event!].sort((a, b) => a.start.localeCompare(b.start)),
    );
    setCreateDraft(null);
    if (visibleRange) {
      await loadRange(visibleRange.timeMin, visibleRange.timeMax, {
        refresh: true,
      });
    }
  }

  function selectEvent(event: GoogleCalendarEvent, anchor: CalendarEventAnchor) {
    setCreateDraft(null);
    setEditingTaskId(null);
    setSelectedEvent({ event, anchor });
  }

  function selectTask(taskId: string) {
    setSelectedEvent(null);
    setCreateDraft(null);
    setEditingTaskId(taskId);
  }

  function updateActivityLinkForSelectedEvent(
    link: CalendarActivityLink | null,
  ) {
    if (!selectedEvent) return;
    const { event } = selectedEvent;
    setActivityLinks((previous) => {
      const without = previous.filter(
        (item) =>
          !(
            item.googleEventId === event.id &&
            item.googleCalendarId === event.calendarId
          ),
      );
      return link ? [...without, link] : without;
    });
  }

  const selectedEventActivityLink = useMemo(() => {
    if (!selectedEvent) return null;
    return (
      activityLinks.find(
        (link) =>
          link.googleEventId === selectedEvent.event.id &&
          link.googleCalendarId === selectedEvent.event.calendarId,
      ) ?? null
    );
  }, [activityLinks, selectedEvent]);

  return {
    // prefs
    weekStartsOn,
    dayStartsHour,
    primaryTimezone,
    primaryLabel,
    secondaryTimezoneEnabled,
    secondaryTimezone,
    secondaryLabel,
    writableCalendarId,
    optionsInitial,
    writableCalendars,

    // data
    visibleEvents,
    placedTasks,
    unscheduledTasks,
    selectedEventActivityLink,

    // ui state
    isBusy,
    errorMessage,
    draggingTaskId,
    setDraggingTaskId,
    optionsOpen,
    setOptionsOpen,
    sidebarOpen,
    setSidebar,
    selectedEvent,
    setSelectedEvent,
    createDraft,
    setCreateDraft,
    editingTaskId,
    setEditingTaskId,
    editingTask,

    // handlers
    refresh,
    saveOptions,
    disconnectGoogleCalendar,
    handleRangeChange,
    handleDropTask,
    saveCalendarEvent,
    handleTaskSaved,
    handleTaskArchived,
    openCreateSlot,
    createFromSlot,
    selectEvent,
    selectTask,
    updateActivityLinkForSelectedEvent,
  };
}
