import "server-only";

import { listGoogleEventsCached } from "@/lib/workspace/calendar/events";
import {
  formatEventTimeRange,
  todayRange,
} from "@/lib/workspace/calendar/time";
import {
  getCalendarPreferences,
  getStoredGoogleToken,
} from "@/lib/workspace/calendar/tokens";
import { hasGoogleCalendarOAuthConfig } from "@/lib/workspace/calendar/oauth";
import { listDocs } from "@/lib/workspace/docs";
import { listProjects } from "@/lib/workspace/projects";
import { listTasks } from "@/lib/workspace/tasks";
import { todayDateKey } from "@/lib/workspace/labels";

export type AssistantContext = {
  nowIso: string;
  todayKey: string;
  events: {
    summary: string;
    time: string;
    calendar: string;
  }[];
  todayTasks: {
    title: string;
    priority: string;
    due_at: string | null;
    estimated_minutes: number | null;
  }[];
  overdueTasks: {
    title: string;
    priority: string;
    due_at: string | null;
  }[];
  upcomingTasks: {
    title: string;
    scheduled_date: string | null;
    priority: string;
  }[];
  inboxTasks: { title: string; priority: string }[];
  recentDocs: { title: string; updated_at: string; excerpt: string }[];
  projects: { name: string; status: string }[];
};

/** Build a compact daily context — never dump the whole DB. */
export async function buildTodayAssistantContext(): Promise<AssistantContext> {
  const todayKey = todayDateKey();
  const [
    todayTasks,
    overdueTasks,
    upcomingTasks,
    inboxTasks,
    recentDocs,
    projects,
  ] = await Promise.all([
    listTasks({ view: "today", limit: 20 }),
    listTasks({ view: "overdue", limit: 15 }),
    listTasks({ view: "upcoming", limit: 15 }),
    listTasks({ view: "inbox", limit: 15 }),
    listDocs({ limit: 8 }),
    listProjects(),
  ]);

  let events: AssistantContext["events"] = [];
  if (hasGoogleCalendarOAuthConfig()) {
    const stored = await getStoredGoogleToken();
    if (stored) {
      const prefs = await getCalendarPreferences();
      const raw = await listGoogleEventsCached({
        ...todayRange(),
        hiddenCalendarIds: prefs.hidden_calendar_ids,
      });
      events = raw.slice(0, 20).map((ev) => ({
        summary: ev.summary,
        time: formatEventTimeRange(ev.start, ev.end, ev.allDay),
        calendar: ev.calendarSummary,
      }));
    }
  }

  return {
    nowIso: new Date().toISOString(),
    todayKey,
    events,
    todayTasks: todayTasks.map((t) => ({
      title: t.title,
      priority: t.priority,
      due_at: t.due_at,
      estimated_minutes: t.estimated_minutes,
    })),
    overdueTasks: overdueTasks.map((t) => ({
      title: t.title,
      priority: t.priority,
      due_at: t.due_at,
    })),
    upcomingTasks: upcomingTasks.map((t) => ({
      title: t.title,
      scheduled_date: t.scheduled_date,
      priority: t.priority,
    })),
    inboxTasks: inboxTasks.map((t) => ({
      title: t.title,
      priority: t.priority,
    })),
    recentDocs: recentDocs.map((d) => ({
      title: d.title,
      updated_at: d.updated_at,
      excerpt: d.body_md.replace(/\s+/g, " ").trim().slice(0, 160),
    })),
    projects: projects
      .filter((p) => p.status === "active")
      .slice(0, 12)
      .map((p) => ({ name: p.name, status: p.status })),
  };
}

export function formatContextForPrompt(ctx: AssistantContext): string {
  const lines: string[] = [
    `現在日時(ISO): ${ctx.nowIso}`,
    `今日の日付: ${ctx.todayKey}`,
    "",
    "## 今日のカレンダー予定",
  ];
  if (ctx.events.length === 0) {
    lines.push("- （なし / 未接続）");
  } else {
    for (const e of ctx.events) {
      lines.push(`- ${e.time} ${e.summary}（${e.calendar}）`);
    }
  }

  lines.push("", "## Today Tasks");
  if (ctx.todayTasks.length === 0) lines.push("- （なし）");
  else {
    for (const t of ctx.todayTasks) {
      const est = t.estimated_minutes ? ` ~${t.estimated_minutes}分` : "";
      const due = t.due_at ? ` due:${t.due_at}` : "";
      lines.push(`- [${t.priority}] ${t.title}${est}${due}`);
    }
  }

  lines.push("", "## Overdue");
  if (ctx.overdueTasks.length === 0) lines.push("- （なし）");
  else {
    for (const t of ctx.overdueTasks) {
      lines.push(`- [${t.priority}] ${t.title} due:${t.due_at ?? "?"}`);
    }
  }

  lines.push("", "## Upcoming");
  if (ctx.upcomingTasks.length === 0) lines.push("- （なし）");
  else {
    for (const t of ctx.upcomingTasks) {
      lines.push(
        `- [${t.priority}] ${t.title} scheduled:${t.scheduled_date ?? "?"}`,
      );
    }
  }

  lines.push("", "## Inbox");
  if (ctx.inboxTasks.length === 0) lines.push("- （なし）");
  else {
    for (const t of ctx.inboxTasks) {
      lines.push(`- [${t.priority}] ${t.title}`);
    }
  }

  lines.push("", "## 最近の Docs");
  if (ctx.recentDocs.length === 0) lines.push("- （なし）");
  else {
    for (const d of ctx.recentDocs) {
      lines.push(`- ${d.title} (${d.updated_at.slice(0, 10)}): ${d.excerpt}`);
    }
  }

  lines.push("", "## Active Projects");
  if (ctx.projects.length === 0) lines.push("- （なし）");
  else {
    for (const p of ctx.projects) lines.push(`- ${p.name}`);
  }

  return lines.join("\n");
}

export const ASSISTANT_SYSTEM_PROMPT = `あなたは個人用 Workspace の日次アシスタントです。
与えられた今日の予定・Tasks・Docs・Projects だけを根拠に、日本語で実務的な提案をしてください。

ルール:
- 提案のみ。データベースやカレンダーを変更したと主張しない。
- 未承認の更新は行わない（この API も実行しない）。
- ない情報を捏造しない。不足は質問する。
- 優先度・期限・所要時間・予定の空きを考慮する。
- 簡潔に。箇条書き中心。まず「今日の進め方」を提示する。`;
