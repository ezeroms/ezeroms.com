"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CalendarOptionsValues } from "@/components/calendar/CalendarOptionsModal";
import type {
  CalendarEventAnchor,
  CalendarEventEditValues,
} from "@/components/calendar/CalendarEventPopover";
import type { CalendarSlotDraft } from "@/components/calendar/CalendarSlotCreatePopover";
import type { TaskLaneClickTarget } from "@/components/calendar/TaskLane";
import type { CalendarCreateSlot } from "@/components/calendar/WorkspaceCalendar";
import { type WeekStartsOn } from "@/lib/workspace/calendar/time";
import type {
  CalendarTaskBlock,
  GoogleCalendarEvent,
  GoogleCalendarListItem,
} from "@/types/calendar";
import {
  DEFAULT_TASK_MINUTES,
  workBlockToCalendarBlock,
} from "@/types/calendar";
import type { CalendarActivityLink } from "@/types/contacts";
import type { TaskWorkBlock, WorkspaceTask } from "@/types/workspace";

const SIDEBAR_STORAGE_KEY = "workspace.calendar.tasksSidebarOpen";

export type CalendarBoardControllerInput = {
  calendars: GoogleCalendarListItem[];
  hiddenCalendarIds: string[];
  writableCalendarId: string | null;
  mainCalendarId: string | null;
  weekStartsOn: WeekStartsOn;
  dayStartsHour: number;
  primaryTimezone: string;
  primaryLabel: string;
  secondaryTimezoneEnabled: boolean;
  secondaryTimezone: string;
  secondaryLabel: string;
  canWrite: boolean;
  events: GoogleCalendarEvent[];
  workBlocks: CalendarTaskBlock[];
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
  const [mainCalendarId, setMainCalendarId] = useState(input.mainCalendarId);
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
  const [workBlocks, setWorkBlocks] = useState(input.workBlocks);
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
  const [editingTarget, setEditingTarget] =
    useState<TaskLaneClickTarget | null>(null);

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
      mainCalendarId,
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
      mainCalendarId,
      primaryTimezone,
      primaryLabel,
      secondaryTimezoneEnabled,
      secondaryTimezone,
      secondaryLabel,
    ],
  );

  const loadWorkBlocks = useCallback(
    async (timeMin: string, timeMax: string) => {
      const params = new URLSearchParams({
        time_min: timeMin,
        time_max: timeMax,
        limit: "400",
      });
      const response = await fetch(
        `/api/admin/workspace/work-blocks/?${params}`,
      );
      const data = (await response.json()) as {
        items?: Array<
          TaskWorkBlock & {
            task: Pick<
              WorkspaceTask,
              "id" | "title" | "status" | "priority" | "estimated_minutes"
            >;
          }
        >;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "作業枠の取得に失敗しました");
      }
      setWorkBlocks(
        (data.items ?? []).map((item) =>
          workBlockToCalendarBlock(item, item.task),
        ),
      );
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
          loadWorkBlocks(timeMin, timeMax),
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
    [loadWorkBlocks],
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
            mainCalendarId: next.mainCalendarId,
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
        mainCalendarId?: string | null;
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
      setMainCalendarId(
        data.mainCalendarId !== undefined
          ? data.mainCalendarId
          : next.mainCalendarId,
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
    const task = unscheduledTasks.find((item) => item.id === taskId);
    const titleFromLane = workBlocks.find(
      (b) => b.taskId === taskId,
    )?.taskTitle;
    if (!task && !titleFromLane) return;

    const estimatedMinutes =
      task?.estimated_minutes && task.estimated_minutes > 0
        ? task.estimated_minutes
        : DEFAULT_TASK_MINUTES;
    const startsAt = start.toISOString();
    const endsAt = new Date(
      start.getTime() + estimatedMinutes * 60_000,
    ).toISOString();

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticBlock: CalendarTaskBlock = {
      workBlockId: optimisticId,
      taskId,
      taskTitle: task?.title ?? titleFromLane ?? "（無題）",
      taskStatus: task?.status ?? "inbox",
      taskPriority: task?.priority ?? "none",
      start: startsAt,
      end: endsAt,
    };
    const previousBlocks = workBlocks;
    setWorkBlocks((list) => [...list, optimisticBlock]);

    setIsBusy(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/admin/workspace/work-blocks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          starts_at: startsAt,
          ends_at: endsAt,
        }),
      });
      const data = (await response.json()) as {
        item?: TaskWorkBlock;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "作業枠の配置に失敗しました");
      }
      setWorkBlocks((list) =>
        list.map((block) =>
          block.workBlockId === optimisticId
            ? {
                ...block,
                workBlockId: data.item!.id,
                start: data.item!.starts_at,
                end: data.item!.ends_at,
              }
            : block,
        ),
      );
    } catch (error) {
      setWorkBlocks(previousBlocks);
      setErrorMessage(
        error instanceof Error ? error.message : "作業枠の配置に失敗しました",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleMoveWorkBlock(workBlockId: string, start: Date) {
    const block = workBlocks.find((item) => item.workBlockId === workBlockId);
    if (!block) return;
    if (
      workBlockId.startsWith("optimistic-") ||
      workBlockId.startsWith("task:")
    ) {
      return;
    }

    const durationMs = Date.parse(block.end) - Date.parse(block.start);
    if (!Number.isFinite(durationMs) || durationMs <= 0) return;

    const startsAt = start.toISOString();
    const endsAt = new Date(start.getTime() + durationMs).toISOString();
    if (
      Math.abs(Date.parse(block.start) - start.getTime()) < 30_000 &&
      Math.abs(Date.parse(block.end) - Date.parse(endsAt)) < 30_000
    ) {
      return;
    }

    const previousBlocks = workBlocks;
    setWorkBlocks((list) =>
      list.map((item) =>
        item.workBlockId === workBlockId
          ? { ...item, start: startsAt, end: endsAt }
          : item,
      ),
    );
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const response = await fetch(
        `/api/admin/workspace/work-blocks/${workBlockId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            starts_at: startsAt,
            ends_at: endsAt,
          }),
        },
      );
      const data = (await response.json()) as {
        item?: TaskWorkBlock;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "作業枠の移動に失敗しました");
      }
      setWorkBlocks((list) =>
        list.map((item) =>
          item.workBlockId === workBlockId
            ? {
                ...item,
                start: data.item!.starts_at,
                end: data.item!.ends_at,
              }
            : item,
        ),
      );
    } catch (error) {
      setWorkBlocks(previousBlocks);
      setErrorMessage(
        error instanceof Error ? error.message : "作業枠の移動に失敗しました",
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
    if (!editingTarget) return null;
    return (
      unscheduledTasks.find((task) => task.id === editingTarget.taskId) ?? null
    );
  }, [editingTarget, unscheduledTasks]);

  function handleTaskSaved(
    task: WorkspaceTask,
    workBlock?: { id: string; starts_at: string; ends_at: string },
  ) {
    setWorkBlocks((list) =>
      list.map((block) => {
        if (workBlock && block.workBlockId === workBlock.id) {
          return {
            ...block,
            taskTitle: task.title,
            taskStatus: task.status,
            taskPriority: task.priority,
            start: workBlock.starts_at,
            end: workBlock.ends_at,
          };
        }
        if (block.taskId === task.id) {
          return {
            ...block,
            taskTitle: task.title,
            taskStatus: task.status,
            taskPriority: task.priority,
          };
        }
        return block;
      }),
    );
    setUnscheduledTasks((list) => {
      if (task.status === "done" || task.status === "archived") {
        return list.filter((item) => item.id !== task.id);
      }
      const next = list.some((item) => item.id === task.id)
        ? list.map((item) => (item.id === task.id ? task : item))
        : [...list, task];
      return [...next].sort((a, b) => {
        const aDue = a.due_at ? Date.parse(a.due_at) : Number.POSITIVE_INFINITY;
        const bDue = b.due_at ? Date.parse(b.due_at) : Number.POSITIVE_INFINITY;
        if (aDue !== bDue) return aDue - bDue;
        return a.title.localeCompare(b.title, "ja");
      });
    });
    if (visibleRange) {
      void loadWorkBlocks(visibleRange.timeMin, visibleRange.timeMax);
    }
    setEditingTarget(null);
  }

  function handleTaskArchived(taskId: string) {
    setWorkBlocks((list) => list.filter((item) => item.taskId !== taskId));
    setUnscheduledTasks((list) => list.filter((item) => item.id !== taskId));
    setEditingTarget(null);
  }

  function handleWorkBlockDeleted(workBlockId: string) {
    setWorkBlocks((list) =>
      list.filter((item) => item.workBlockId !== workBlockId),
    );
    setEditingTarget(null);
  }

  function openCreateSlot(slot: CalendarCreateSlot) {
    setSelectedEvent(null);
    setEditingTarget(null);
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
      const blockRes = await fetch("/api/admin/workspace/work-blocks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: data.item.id,
          starts_at: values.start,
          ends_at: values.end,
        }),
      });
      const blockData = (await blockRes.json()) as {
        item?: TaskWorkBlock;
        error?: string;
      };
      if (!blockRes.ok || !blockData.item) {
        throw new Error(blockData.error || "作業枠の作成に失敗しました");
      }
      setWorkBlocks((list) => [
        ...list,
        workBlockToCalendarBlock(blockData.item!, data.item!),
      ]);
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
    setEditingTarget(null);
    setSelectedEvent({ event, anchor });
  }

  function selectTask(target: TaskLaneClickTarget) {
    setSelectedEvent(null);
    setCreateDraft(null);
    setEditingTarget(target);
  }

  /** サイドバーの未完了タスク → 作業枠なしで編集モーダル */
  function openIncompleteTask(taskId: string) {
    setSelectedEvent(null);
    setCreateDraft(null);
    setEditingTarget({
      taskId,
      workBlockId: "task:sidebar",
      start: "",
      end: "",
    });
  }

  async function toggleIncompleteTaskDone(task: WorkspaceTask) {
    const nextStatus = task.status === "done" ? "active" : "done";
    const nextProgress =
      nextStatus === "done" ? 100 : (task.progress_percent ?? 0);
    const optimistic: WorkspaceTask = {
      ...task,
      status: nextStatus,
      progress_percent: nextProgress,
    };
    setUnscheduledTasks((list) => {
      if (nextStatus === "done") {
        return list.filter((item) => item.id !== task.id);
      }
      return list.map((item) => (item.id === task.id ? optimistic : item));
    });
    try {
      const response = await fetch(`/api/admin/workspace/tasks/${task.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          ...(nextStatus === "done" ? { progress_percent: 100 } : {}),
        }),
      });
      const data = (await response.json()) as {
        item?: WorkspaceTask;
        error?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "更新に失敗しました");
      }
      setUnscheduledTasks((list) => {
        if (data.item!.status === "done" || data.item!.status === "archived") {
          return list.filter((item) => item.id !== task.id);
        }
        const exists = list.some((item) => item.id === task.id);
        if (exists) {
          return list.map((item) =>
            item.id === task.id ? data.item! : item,
          );
        }
        return [...list, data.item!];
      });
      setWorkBlocks((list) =>
        list.map((block) =>
          block.taskId === task.id
            ? {
                ...block,
                taskStatus: data.item!.status,
                taskPriority: data.item!.priority,
                taskTitle: data.item!.title,
              }
            : block,
        ),
      );
    } catch (error) {
      setUnscheduledTasks((list) => {
        const exists = list.some((item) => item.id === task.id);
        if (exists) {
          return list.map((item) => (item.id === task.id ? task : item));
        }
        return [...list, task].sort((a, b) => {
          const aDue = a.due_at ? Date.parse(a.due_at) : Number.POSITIVE_INFINITY;
          const bDue = b.due_at ? Date.parse(b.due_at) : Number.POSITIVE_INFINITY;
          if (aDue !== bDue) return aDue - bDue;
          return a.title.localeCompare(b.title, "ja");
        });
      });
      setErrorMessage(
        error instanceof Error ? error.message : "更新に失敗しました",
      );
    }
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
    workBlocks,
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
    editingTarget,
    setEditingTarget,
    editingTask,

    // handlers
    refresh,
    saveOptions,
    disconnectGoogleCalendar,
    handleRangeChange,
    handleDropTask,
    handleMoveWorkBlock,
    saveCalendarEvent,
    handleTaskSaved,
    handleTaskArchived,
    handleWorkBlockDeleted,
    openCreateSlot,
    createFromSlot,
    selectEvent,
    selectTask,
    openIncompleteTask,
    toggleIncompleteTaskDone,
    updateActivityLinkForSelectedEvent,
  };
}
