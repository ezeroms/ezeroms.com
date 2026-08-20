"use client";

import {
  CalendarCog,
  ChevronRight,
  PanelRightClose,
  RefreshCw,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalendarOptionsModal } from "@/components/calendar/CalendarOptionsModal";
import { CalendarEventPopover } from "@/components/calendar/CalendarEventPopover";
import { CalendarSlotCreatePopover } from "@/components/calendar/CalendarSlotCreatePopover";
import { useCalendarBoardController } from "@/components/calendar/useCalendarBoardController";
import { WorkspaceCalendar } from "@/components/calendar/WorkspaceCalendar";
import { TaskCheckbox } from "@/components/tasks/TaskCheckbox";
import { TaskEditModal } from "@/components/tasks/TaskEditModal";
import { isPersistedWorkBlockId } from "@/components/calendar/TaskLane";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { surfaceCard } from "@/lib/site/card-styles";
import {
  GOOGLE_CALENDAR_OAUTH_START_PATH,
  googleCalendarMessageNeedsReconnect,
} from "@/lib/workspace/calendar/auth-error";
import type { WeekStartsOn } from "@/lib/workspace/calendar/time";
import {
  DEFAULT_PRIMARY_LABEL,
  DEFAULT_PRIMARY_TIMEZONE,
  DEFAULT_SECONDARY_LABEL,
  DEFAULT_SECONDARY_TIMEZONE,
} from "@/lib/workspace/calendar/timezones";
import type {
  GoogleCalendarEvent,
  GoogleCalendarListItem,
} from "@/types/calendar";
import type { CalendarTaskBlock } from "@/types/calendar";
import type { WorkspaceTask } from "@/types/workspace";

function formatTaskDueLabel(dueAt: string | null): string | null {
  if (!dueAt) return null;
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

type Props = {
  title: string;
  description?: string;
  connected: boolean;
  email: string | null;
  oauthConfigured: boolean;
  calendars: GoogleCalendarListItem[];
  hiddenCalendarIds: string[];
  writableCalendarId: string | null;
  mainCalendarId: string | null;
  weekStartsOn: WeekStartsOn;
  dayStartsHour: number;
  primaryTimezone?: string;
  primaryLabel?: string;
  secondaryTimezoneEnabled?: boolean;
  secondaryTimezone?: string;
  secondaryLabel?: string;
  canWrite: boolean;
  events: GoogleCalendarEvent[];
  workBlocks: CalendarTaskBlock[];
  unscheduledTasks: WorkspaceTask[];
  connectError?: string | null;
};

export function CalendarBoard({
  title,
  description,
  connected,
  email,
  oauthConfigured,
  calendars,
  hiddenCalendarIds,
  writableCalendarId,
  mainCalendarId,
  weekStartsOn,
  dayStartsHour,
  primaryTimezone = DEFAULT_PRIMARY_TIMEZONE,
  primaryLabel = DEFAULT_PRIMARY_LABEL,
  secondaryTimezoneEnabled = false,
  secondaryTimezone = DEFAULT_SECONDARY_TIMEZONE,
  secondaryLabel = DEFAULT_SECONDARY_LABEL,
  canWrite,
  events,
  workBlocks,
  unscheduledTasks,
  connectError,
}: Props) {
  const board = useCalendarBoardController({
    calendars,
    hiddenCalendarIds,
    writableCalendarId,
    mainCalendarId,
    weekStartsOn,
    dayStartsHour,
    primaryTimezone,
    primaryLabel,
    secondaryTimezoneEnabled,
    secondaryTimezone,
    secondaryLabel,
    canWrite,
    events,
    workBlocks,
    unscheduledTasks,
  });

  if (!oauthConfigured) {
    return (
      <>
        <AdminPageHeader title={title} description={description} />
        <div className={surfaceCard({ className: "p-4 text-sm text-muted-foreground" })}>
          Google OAuth が未設定です。.env.local に{" "}
          <code className="text-xs">GOOGLE_CLIENT_ID</code> と{" "}
          <code className="text-xs">GOOGLE_CLIENT_SECRET</code>{" "}
          を設定してください（ENV_SETUP.md 参照）。
        </div>
      </>
    );
  }

  if (!connected) {
    const reconnect = googleCalendarMessageNeedsReconnect(connectError);
    return (
      <>
        <AdminPageHeader
          title={title}
          description={description}
          actions={
            <Button asChild>
              <a href={GOOGLE_CALENDAR_OAUTH_START_PATH}>
                {reconnect
                  ? "Googleカレンダーを再接続"
                  : "Googleカレンダーを接続"}
              </a>
            </Button>
          }
        />
        <div className={surfaceCard({ className: "flex flex-col gap-3 p-4" })}>
          <p className="m-0 text-sm text-muted-foreground">
            Googleカレンダーを接続すると、予定の表示と Task
            からの作業枠作成ができます。書き込みは承認後のみです。
          </p>
          {connectError ? (
            <p className="m-0 text-sm text-red-600" role="alert">
              {reconnect ? connectError : `接続エラー: ${connectError}`}
            </p>
          ) : null}
        </div>
      </>
    );
  }

  const refreshTitleAction = (
    <button
      type="button"
      className={cn(
        "share-btn relative inline-flex size-8 shrink-0 items-center justify-center rounded-md border-0 bg-transparent",
        "text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
      data-tooltip="再取得"
      title="再取得"
      aria-label="再取得"
      aria-busy={board.isBusy}
      disabled={board.isBusy}
      onClick={() => void board.refresh()}
    >
      <RefreshCw
        className={cn("size-4", board.isBusy && "animate-spin")}
        aria-hidden
      />
    </button>
  );

  const headerActions = (
    <>
      <Button
        type="button"
        variant="outline"
        aria-haspopup="dialog"
        onClick={() => board.setOptionsOpen(true)}
      >
        <CalendarCog className="size-4" aria-hidden />
        カレンダーオプション
      </Button>
      <Button
        type="button"
        variant="outline"
        aria-pressed={board.sidebarOpen}
        aria-label={
          board.sidebarOpen ? "未完了タスクを閉じる" : "未完了タスクを表示"
        }
        onClick={() => board.setSidebar(!board.sidebarOpen)}
      >
        {board.sidebarOpen ? (
          <PanelRightClose className="size-4" aria-hidden />
        ) : (
          <ChevronRight className="size-4" aria-hidden />
        )}
        未完了タスク
      </Button>
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0">
        <AdminPageHeader
          title={title}
          description={description}
          titleAction={refreshTitleAction}
          actions={headerActions}
        />
      </div>

      <CalendarOptionsModal
        open={board.optionsOpen}
        onClose={() => board.setOptionsOpen(false)}
        calendars={calendars}
        writableCalendars={board.writableCalendars}
        canWrite={canWrite}
        initial={board.optionsInitial}
        busy={board.isBusy}
        onSave={board.saveOptions}
        onDisconnect={() => {
          board.setOptionsOpen(false);
          void board.disconnectGoogleCalendar();
        }}
      />

      {board.selectedEvent ? (
        <CalendarEventPopover
          open
          event={board.selectedEvent.event}
          timeZone={board.primaryTimezone}
          canWrite={canWrite}
          initialActivityLink={board.selectedEventActivityLink}
          onClose={() => board.setSelectedEvent(null)}
          onSave={board.saveCalendarEvent}
          onActivityLinkChange={board.updateActivityLinkForSelectedEvent}
        />
      ) : null}

      {board.createDraft ? (
        <CalendarSlotCreatePopover
          open
          draft={board.createDraft}
          timeZone={board.primaryTimezone}
          onClose={() => board.setCreateDraft(null)}
          onSave={board.createFromSlot}
        />
      ) : null}

      <TaskEditModal
        key={
          board.editingTarget
            ? `${board.editingTarget.taskId}:${board.editingTarget.workBlockId}`
            : "closed"
        }
        open={Boolean(board.editingTarget)}
        taskId={board.editingTarget?.taskId ?? null}
        workBlockId={
          board.editingTarget?.workBlockId &&
          isPersistedWorkBlockId(board.editingTarget.workBlockId)
            ? board.editingTarget.workBlockId
            : null
        }
        initialWorkBlock={
          board.editingTarget?.workBlockId &&
          isPersistedWorkBlockId(board.editingTarget.workBlockId)
            ? {
                starts_at: board.editingTarget.start,
                ends_at: board.editingTarget.end,
              }
            : null
        }
        initialTask={board.editingTask}
        onClose={() => board.setEditingTarget(null)}
        onSaved={board.handleTaskSaved}
        onArchived={board.handleTaskArchived}
        onWorkBlockDeleted={board.handleWorkBlockDeleted}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row lg:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
          {email ? (
            <p className="m-0 shrink-0 text-xs text-muted-foreground">{email}</p>
          ) : null}

          {board.errorMessage ? (
            <div
              className="flex shrink-0 flex-wrap items-center gap-3"
              role="alert"
            >
              <p className="m-0 text-sm text-red-600">{board.errorMessage}</p>
              {googleCalendarMessageNeedsReconnect(board.errorMessage) ? (
                <Button asChild size="sm">
                  <a href={GOOGLE_CALENDAR_OAUTH_START_PATH}>
                    Googleカレンダーを再接続
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}

          <WorkspaceCalendar
            key={`${board.weekStartsOn}:${board.dayStartsHour}:${board.primaryTimezone}:${board.secondaryTimezoneEnabled}:${board.secondaryTimezone}`}
            className="min-h-0 flex-1"
            events={board.visibleEvents}
            workBlocks={board.workBlocks}
            calendars={calendars}
            weekStartsOn={board.weekStartsOn}
            dayStartsHour={board.dayStartsHour}
            primaryTimezone={board.primaryTimezone}
            primaryLabel={board.primaryLabel}
            secondaryTimezoneEnabled={board.secondaryTimezoneEnabled}
            secondaryTimezone={board.secondaryTimezone}
            secondaryLabel={board.secondaryLabel}
            onRangeChange={board.handleRangeChange}
            draggingTask={Boolean(board.draggingTaskId)}
            onDropTask={board.handleDropTask}
            onMoveWorkBlock={board.handleMoveWorkBlock}
            onResizeWorkBlock={board.handleResizeWorkBlock}
            onMoveEvent={canWrite ? board.handleMoveEvent : undefined}
            onResizeEvent={canWrite ? board.handleResizeEvent : undefined}
            onEventSelect={board.selectEvent}
            onCreateSlot={board.openCreateSlot}
            canCreateSchedule={canWrite && Boolean(board.writableCalendarId)}
            onTaskSelect={board.selectTask}
          />
        </div>

        {board.sidebarOpen ? (
          <aside className="flex max-h-full w-full shrink-0 flex-col space-y-3 overflow-y-auto lg:w-64">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                未完了タスク
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => board.setSidebar(false)}
              >
                閉じる
              </Button>
            </div>
            {board.unscheduledTasks.length === 0 ? (
              <p className="m-0 text-xs text-muted-foreground">
                未完了の Task はありません。
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {board.unscheduledTasks.map((task) => {
                  const hasEstimate =
                    task.estimated_minutes != null &&
                    task.estimated_minutes > 0;
                  const progress = Math.min(
                    100,
                    Math.max(0, task.progress_percent ?? 0),
                  );
                  const dueLabel = formatTaskDueLabel(task.due_at);
                  const dueOverdue =
                    task.due_at != null &&
                    Date.parse(task.due_at) < Date.now();
                  return (
                    <li
                      key={task.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          "application/x-workspace-task",
                          task.id,
                        );
                        event.dataTransfer.effectAllowed = "copy";
                        board.setDraggingTaskId(task.id);
                      }}
                      onDragEnd={() => board.setDraggingTaskId(null)}
                      className={cn(
                        "cursor-grab rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm",
                        "hover:border-border-hover active:cursor-grabbing",
                        board.draggingTaskId === task.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-[1.375em] shrink-0 items-center text-sm leading-snug">
                          <TaskCheckbox
                            checked={task.status === "done"}
                            onChange={() =>
                              void board.toggleIncompleteTaskDone(task)
                            }
                          />
                        </span>
                        <button
                          type="button"
                          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-left shadow-none"
                          draggable={false}
                          onClick={() => board.openIncompleteTask(task.id)}
                        >
                          <span className="block text-sm font-medium leading-snug text-foreground">
                            {task.title}
                          </span>
                          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="tabular-nums">
                              {hasEstimate
                                ? `${task.estimated_minutes} 分`
                                : "見積もり未設定"}
                            </span>
                            <span className="tabular-nums">{progress}%</span>
                            {dueLabel ? (
                              <span
                                className={cn(
                                  "tabular-nums",
                                  dueOverdue && "text-red-700",
                                )}
                              >
                                期限 {dueLabel}
                              </span>
                            ) : (
                              <span>期限なし</span>
                            )}
                          </p>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
