import Link from "next/link";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WorkspaceConfigNotice } from "@/components/admin/WorkspaceConfigNotice";
import { BlogTrendsCard } from "@/components/workspace/BlogTrendsCard";
import { WorkloadMeter } from "@/components/workspace/WorkloadMeter";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { findAdminNavItem } from "@/lib/admin/nav";
import { hasGaDataApiConfig } from "@/lib/analytics/config";
import { fetchAnalyticsReport } from "@/lib/analytics/report";
import { getSessionUser } from "@/lib/supabase/auth";
import {
  listGoogleEventsCached,
  resolveMainCalendarId,
} from "@/lib/workspace/calendar/events";
import { hasGoogleCalendarOAuthConfig } from "@/lib/workspace/calendar/oauth";
import {
  formatEventTimeRange,
  todayRange,
} from "@/lib/workspace/calendar/time";
import {
  GOOGLE_CALENDAR_OAUTH_START_PATH,
  googleCalendarMessageNeedsReconnect,
} from "@/lib/workspace/calendar/auth-error";
import {
  getCalendarPreferences,
  getStoredGoogleToken,
} from "@/lib/workspace/calendar/tokens";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { buildWorkloadSnapshot } from "@/lib/workspace/load/build";
import type { AnalyticsReport } from "@/types/analytics";
import type { WorkloadSnapshot } from "@/lib/workspace/load/compute";

export const dynamic = "force-dynamic";

const navItem = findAdminNavItem("/admin/workspace/")!;

export default async function AdminWorkspaceDashboardPage() {
  await getSessionUser();
  const todayLabel = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "full",
  }).format(new Date());

  if (!hasWorkspaceConfig()) {
    return (
      <AdminContent width="wide">
        <AdminPageHeader
          title={navItem.label}
          description={todayLabel}
        />
        <WorkspaceConfigNotice />
      </AdminContent>
    );
  }

  let loadError: string | null = null;
  let calendarError: string | null = null;
  let todayEvents: Awaited<ReturnType<typeof listGoogleEventsCached>> = [];
  let calendarConnected = false;
  let oauthConfigured = hasGoogleCalendarOAuthConfig();
  let workload: WorkloadSnapshot | null = null;
  let gaConfigured = hasGaDataApiConfig();
  let gaReport: AnalyticsReport | null = null;
  let gaError: string | null = null;

  try {
    const [prefs, stored, loadResult] = await Promise.all([
      getCalendarPreferences(),
      oauthConfigured ? getStoredGoogleToken() : Promise.resolve(null),
      buildWorkloadSnapshot(),
    ]);

    calendarConnected = Boolean(stored);
    workload = loadResult.snapshot;
    calendarConnected = loadResult.calendarConnected || calendarConnected;
    oauthConfigured = loadResult.oauthConfigured;
    calendarError = loadResult.calendarError;

    if (calendarConnected && !calendarError) {
      try {
        const mainCalendarId = await resolveMainCalendarId(
          prefs.main_calendar_id,
        );
        todayEvents = mainCalendarId
          ? await listGoogleEventsCached({
              ...todayRange(),
              calendarIds: [mainCalendarId],
            })
          : [];
      } catch (e) {
        calendarError =
          e instanceof Error ? e.message : "カレンダー予定の取得に失敗しました";
      }
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
  }

  if (gaConfigured) {
    try {
      gaReport = await fetchAnalyticsReport("1");
    } catch (e) {
      gaError = e instanceof Error ? e.message : "Analytics の読み込みに失敗しました";
    }
  }

  const calendarNeedsReconnect =
    googleCalendarMessageNeedsReconnect(calendarError);

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={navItem.label}
        description={todayLabel}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/admin/workspace/tasks/?view=inbox">Tasks</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/workspace/docs/">Docs</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/workspace/calendar/">Calendar</Link>
            </Button>
          </div>
        }
      />

      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}

      {calendarError ? (
        <Alert variant="destructive" className="mb-4">
          <span className="block">{calendarError}</span>
          {calendarNeedsReconnect ? (
            <a
              href={GOOGLE_CALENDAR_OAUTH_START_PATH}
              className="mt-2 inline-block font-medium underline"
            >
              Googleカレンダーを再接続
            </a>
          ) : (
            <Link
              href="/admin/workspace/calendar/"
              className="mt-2 inline-block font-medium underline"
            >
              カレンダーを開く
            </Link>
          )}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {workload ? (
          <div className="lg:col-span-2">
            <WorkloadMeter
              snapshot={workload}
              calendarConnected={calendarConnected}
              oauthConfigured={oauthConfigured}
            />
          </div>
        ) : null}

        <BlogTrendsCard
          report={gaReport}
          configured={gaConfigured}
          error={gaError}
        />

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              今日の予定
            </h2>
            <Link
              href="/admin/workspace/calendar/"
              className="text-xs text-muted-foreground no-underline hover:underline"
            >
              週表示
            </Link>
          </div>
          {!oauthConfigured ? (
            <p className="m-0 text-sm text-muted-foreground">
              Google OAuth 未設定（ENV_SETUP.md）
            </p>
          ) : !calendarConnected ? (
            <div className="space-y-2">
              <p className="m-0 text-sm text-muted-foreground">
                カレンダー未接続
              </p>
              <Button asChild size="sm" variant="outline">
                <a href={GOOGLE_CALENDAR_OAUTH_START_PATH}>
                  接続する
                </a>
              </Button>
            </div>
          ) : todayEvents.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">今日の予定はありません</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {todayEvents.map((ev) => (
                <li
                  key={`${ev.calendarId}:${ev.id}`}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="mr-2 text-xs tabular-nums text-muted-foreground">
                    {formatEventTimeRange(ev.start, ev.end, ev.allDay)}
                  </span>
                  {ev.htmlLink ? (
                    <a
                      href={ev.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-foreground"
                    >
                      {ev.summary}
                    </a>
                  ) : (
                    <span className="font-medium">{ev.summary}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminContent>
  );
}
