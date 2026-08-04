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
  getCalendarPreferences,
  getStoredGoogleToken,
  isGoogleCalendarAuthError,
} from "@/lib/workspace/calendar/tokens";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { listDocs } from "@/lib/workspace/docs";
import { buildWorkloadSnapshot } from "@/lib/workspace/load/build";
import { listProjects } from "@/lib/workspace/projects";
import { listTasks } from "@/lib/workspace/tasks";
import { todayDateKey } from "@/lib/workspace/labels";
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
  let todayTasks: Awaited<ReturnType<typeof listTasks>> = [];
  let overdueTasks: Awaited<ReturnType<typeof listTasks>> = [];
  let inboxTasks: Awaited<ReturnType<typeof listTasks>> = [];
  let recentDocs: Awaited<ReturnType<typeof listDocs>> = [];
  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  let workload: WorkloadSnapshot | null = null;
  let gaConfigured = hasGaDataApiConfig();
  let gaReport: AnalyticsReport | null = null;
  let gaError: string | null = null;

  try {
    const [prefs, stored, today, overdue, inbox, docs, projs, loadResult] =
      await Promise.all([
        getCalendarPreferences(),
        oauthConfigured ? getStoredGoogleToken() : Promise.resolve(null),
        listTasks({ view: "today", limit: 20 }),
        listTasks({ view: "overdue", limit: 20 }),
        listTasks({ view: "inbox", limit: 20 }),
        listDocs({ limit: 8 }),
        listProjects(),
        buildWorkloadSnapshot(),
      ]);

    calendarConnected = Boolean(stored);
    todayTasks = today;
    overdueTasks = overdue;
    inboxTasks = inbox;
    recentDocs = docs;
    projects = projs.filter((p) => p.status === "active");
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
      gaReport = await fetchAnalyticsReport("7");
    } catch (e) {
      gaError = e instanceof Error ? e.message : "Analytics の読み込みに失敗しました";
    }
  }

  const calendarNeedsReconnect =
    Boolean(calendarError) &&
    (isGoogleCalendarAuthError(new Error(calendarError ?? "")) ||
      (calendarError ?? "").includes("再接続") ||
      (calendarError ?? "").toLowerCase().includes("invalid authentication"));

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
              href="/api/admin/workspace/calendar/oauth/start/"
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

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
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
                <a href="/api/admin/workspace/calendar/oauth/start/">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-2">
          <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Today Tasks
          </h2>
          {todayTasks.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">
              予定日が {todayDateKey()} の Task はありません
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {todayTasks.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/admin/workspace/tasks/${t.id}/`}
                    className="block rounded-md px-1 py-1.5 text-sm no-underline hover:bg-black/[0.02]"
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Overdue
          </h2>
          {overdueTasks.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">期限切れはありません</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {overdueTasks.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/admin/workspace/tasks/${t.id}/`}
                    className="block rounded-md px-1 py-1.5 text-sm text-red-700 no-underline hover:bg-black/[0.02]"
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Inbox
          </h2>
          {inboxTasks.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">Inbox は空です</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {inboxTasks.slice(0, 8).map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/admin/workspace/tasks/${t.id}/`}
                    className="block rounded-md px-1 py-1.5 text-sm no-underline hover:bg-black/[0.02]"
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            最近の Docs
          </h2>
          {recentDocs.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">Docs はまだありません</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {recentDocs.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/admin/workspace/docs/${d.id}/`}
                    className="block rounded-md px-1 py-1.5 text-sm no-underline hover:bg-black/[0.02]"
                  >
                    {d.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Projects
          </h2>
          {projects.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">
              Active Project はありません
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {projects.map((p) => (
                <li key={p.id} className="px-1 py-1.5 text-sm">
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminContent>
  );
}
