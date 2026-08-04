import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { CalendarBoard } from "@/components/calendar/CalendarBoard";
import { Alert } from "@/components/ui/alert";
import { findAdminNavItem } from "@/lib/admin/nav";
import { getSessionUser } from "@/lib/supabase/auth";
import {
  listGoogleCalendars,
  listGoogleEventsCached,
} from "@/lib/workspace/calendar/events";
import {
  hasGoogleCalendarOAuthConfig,
  tokenHasCalendarWriteScope,
} from "@/lib/workspace/calendar/oauth";
import { calendarWeekRange } from "@/lib/workspace/calendar/time";
import {
  getCalendarPreferences,
  getStoredGoogleToken,
} from "@/lib/workspace/calendar/tokens";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { listTasks } from "@/lib/workspace/tasks";
import { listWorkBlocksInRange } from "@/lib/workspace/work-blocks";
import { workBlockToCalendarBlock } from "@/types/calendar";

export const dynamic = "force-dynamic";

const navItem = findAdminNavItem("/admin/workspace/calendar/")!;

const ERROR_LABELS: Record<string, string> = {
  workspace_db: "Workspace DB が未設定です",
  missing_code: "認証コードがありません",
  invalid_state: "OAuth state が不正です。もう一度接続してください",
  token_exchange: "トークン取得に失敗しました",
  access_denied: "Google 側で拒否されました",
};

export default async function AdminWorkspaceCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  await getSessionUser();
  const sp = await searchParams;
  const connectError = sp.error
    ? ERROR_LABELS[sp.error] || sp.error
    : null;

  if (!hasWorkspaceConfig()) {
    return (
      <AdminContent width="wide">
        <AdminPageHeader
          title={navItem.label}
          description={navItem.description}
        />
        <WorkspaceConfigNotice />
      </AdminContent>
    );
  }

  const oauthConfigured = hasGoogleCalendarOAuthConfig();
  let loadError: string | null = null;
  let connected = false;
  let email: string | null = null;
  let calendars: Awaited<ReturnType<typeof listGoogleCalendars>> = [];
  let hiddenCalendarIds: string[] = [];
  let writableCalendarId: string | null = null;
  let mainCalendarId: string | null = null;
  let weekStartsOn: "monday" | "sunday" = "monday";
  let dayStartsHour = 0;
  let primaryTimezone = "Asia/Tokyo";
  let primaryLabel = "Tokyo";
  let secondaryTimezoneEnabled = false;
  let secondaryTimezone = "Asia/Taipei";
  let secondaryLabel = "Taipei";
  let canWrite = false;
  let events: Awaited<ReturnType<typeof listGoogleEventsCached>> = [];
  let unscheduledTasks: Awaited<ReturnType<typeof listTasks>> = [];
  let workBlocks: ReturnType<typeof workBlockToCalendarBlock>[] = [];

  try {
    const stored = oauthConfigured ? await getStoredGoogleToken() : null;
    connected = Boolean(stored);
    email = stored?.google_email ?? null;
    canWrite = tokenHasCalendarWriteScope(stored?.scope);

    const [prefs, inbox, active, waiting] = await Promise.all([
      getCalendarPreferences(),
      listTasks({ view: "inbox", limit: 50 }),
      listTasks({ status: "active", limit: 50 }),
      listTasks({ status: "waiting", limit: 50 }),
    ]);
    hiddenCalendarIds = prefs.hidden_calendar_ids;
    writableCalendarId = prefs.writable_calendar_id;
    mainCalendarId = prefs.main_calendar_id;
    weekStartsOn = prefs.week_starts_on;
    dayStartsHour = prefs.day_starts_hour;
    primaryTimezone = prefs.primary_timezone;
    primaryLabel = prefs.primary_timezone_label;
    secondaryTimezoneEnabled = prefs.secondary_timezone_enabled;
    secondaryTimezone = prefs.secondary_timezone;
    secondaryLabel = prefs.secondary_timezone_label;

    // サイドバー: 未完了（Inbox / Active / Waiting）を期限が近い順
    unscheduledTasks = [...inbox, ...active, ...waiting]
      .filter((t) => t.status !== "done" && t.status !== "archived")
      .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
      .sort((a, b) => {
        const aDue = a.due_at ? Date.parse(a.due_at) : Number.POSITIVE_INFINITY;
        const bDue = b.due_at ? Date.parse(b.due_at) : Number.POSITIVE_INFINITY;
        if (aDue !== bDue) return aDue - bDue;
        return a.title.localeCompare(b.title, "ja");
      })
      .slice(0, 40);

    if (connected) {
      const range = calendarWeekRange(new Date(), weekStartsOn);
      const [cals, evts, blocks] = await Promise.all([
        listGoogleCalendars(),
        listGoogleEventsCached({
          timeMin: range.timeMin,
          timeMax: range.timeMax,
          hiddenCalendarIds,
        }),
        listWorkBlocksInRange({
          timeMin: range.timeMin,
          timeMax: range.timeMax,
          limit: 400,
        }),
      ]);
      calendars = cals;
      events = evts;
      workBlocks = blocks.map((b) => workBlockToCalendarBlock(b, b.task));
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
  }

  return (
    <AdminContent
      width="wide"
      className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden"
    >
      {loadError ? (
        <>
          <AdminPageHeader title={navItem.label} />
          <Alert variant="destructive" className="mb-4">
            {loadError}
          </Alert>
        </>
      ) : (
        <CalendarBoard
          title={navItem.label}
          connected={connected}
          email={email}
          oauthConfigured={oauthConfigured}
          calendars={calendars}
          hiddenCalendarIds={hiddenCalendarIds}
          writableCalendarId={writableCalendarId}
          mainCalendarId={mainCalendarId}
          weekStartsOn={weekStartsOn}
          dayStartsHour={dayStartsHour}
          primaryTimezone={primaryTimezone}
          primaryLabel={primaryLabel}
          secondaryTimezoneEnabled={secondaryTimezoneEnabled}
          secondaryTimezone={secondaryTimezone}
          secondaryLabel={secondaryLabel}
          canWrite={canWrite}
          events={events}
          workBlocks={workBlocks}
          unscheduledTasks={unscheduledTasks}
          connectError={connectError}
        />
      )}
    </AdminContent>
  );
}
