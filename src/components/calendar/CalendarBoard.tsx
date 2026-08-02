"use client";

import Link from "next/link";
import { CalendarCog, ChevronRight, PanelRightClose } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalendarOptionsModal } from "@/components/calendar/CalendarOptionsModal";
import { CalendarEventPopover } from "@/components/calendar/CalendarEventPopover";
import { CalendarSlotCreatePopover } from "@/components/calendar/CalendarSlotCreatePopover";
import { useCalendarBoardController } from "@/components/calendar/useCalendarBoardController";
import { WorkspaceCalendar } from "@/components/calendar/WorkspaceCalendar";
import { TaskEditModal } from "@/components/tasks/TaskEditModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
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
import { DEFAULT_TASK_MINUTES } from "@/types/calendar";
import type { WorkspaceTask } from "@/types/workspace";

type Props = {
  title: string;
  description?: string;
  connected: boolean;
  email: string | null;
  oauthConfigured: boolean;
  calendars: GoogleCalendarListItem[];
  hiddenCalendarIds: string[];
  writableCalendarId: string | null;
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
        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          Google OAuth が未設定です。.env.local に{" "}
          <code className="text-xs">GOOGLE_CLIENT_ID</code> と{" "}
          <code className="text-xs">GOOGLE_CLIENT_SECRET</code>{" "}
          を設定してください（ENV_SETUP.md 参照）。
        </div>
      </>
    );
  }

  if (!connected) {
    return (
      <>
        <AdminPageHeader
          title={title}
          description={description}
          actions={
            <Button asChild>
              <a href="/api/admin/workspace/calendar/oauth/start/">
                Googleカレンダーを接続
              </a>
            </Button>
          }
        />
        <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
          <p className="m-0 text-sm text-muted-foreground">
            Googleカレンダーを接続すると、予定の表示と Task
            からの作業枠作成ができます。書き込みは承認後のみです。
          </p>
          {connectError ? (
            <p className="m-0 text-sm text-red-600" role="alert">
              接続エラー: {connectError}
            </p>
          ) : null}
        </div>
      </>
    );
  }

  const headerActions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={board.refresh}
        disabled={board.isBusy}
      >
        再取得
      </Button>
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
          board.sidebarOpen ? "未配置 Tasks を隠す" : "未配置 Tasks を表示"
        }
        onClick={() => board.setSidebar(!board.sidebarOpen)}
      >
        {board.sidebarOpen ? (
          <PanelRightClose className="size-4" aria-hidden />
        ) : (
          <ChevronRight className="size-4" aria-hidden />
        )}
        未配置 Tasks
      </Button>
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0">
        <AdminPageHeader
          title={title}
          description={description}
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
        open={Boolean(board.editingTarget)}
        taskId={board.editingTarget?.taskId ?? null}
        workBlockId={
          board.editingTarget?.workBlockId.startsWith("task:")
            ? null
            : (board.editingTarget?.workBlockId ?? null)
        }
        initialWorkBlock={
          board.editingTarget
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
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row lg:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
          {email ? (
            <p className="m-0 shrink-0 text-xs text-muted-foreground">{email}</p>
          ) : null}

          {board.errorMessage ? (
            <p className="m-0 shrink-0 text-sm text-red-600" role="alert">
              {board.errorMessage}
            </p>
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
                未配置 Tasks
              </h2>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => board.setSidebar(false)}
              >
                隠す
              </button>
            </div>
            {board.unscheduledTasks.length === 0 ? (
              <p className="m-0 text-xs text-muted-foreground">
                作業時間が未設定の Active / Inbox Task はありません。
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {board.unscheduledTasks.map((task) => {
                  const minutes =
                    task.estimated_minutes && task.estimated_minutes > 0
                      ? task.estimated_minutes
                      : DEFAULT_TASK_MINUTES;
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
                      <Link
                        href={`/admin/workspace/tasks/${task.id}/`}
                        className="block text-sm font-medium text-foreground no-underline hover:underline"
                        draggable={false}
                        onClick={(event) => {
                          if (board.draggingTaskId === task.id) {
                            event.preventDefault();
                          }
                        }}
                      >
                        {task.title}
                      </Link>
                      <p className="m-0 mt-1 text-xs text-muted-foreground">
                        {minutes} 分
                        {task.priority !== "none" ? ` · ${task.priority}` : ""}
                      </p>
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
