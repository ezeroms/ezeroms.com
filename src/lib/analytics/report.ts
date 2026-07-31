import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import {
  getGaPropertyId,
  getGaServiceAccountCredentials,
  hasGaDataApiConfig,
} from "@/lib/analytics/config";
import type {
  AnalyticsPageRow,
  AnalyticsRange,
  AnalyticsReport,
  AnalyticsSourceRow,
  AnalyticsTrendPoint,
} from "@/types/analytics";

let client: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient {
  if (!client) {
    const creds = getGaServiceAccountCredentials();
    client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
    });
  }
  return client;
}

function rangeDays(range: AnalyticsRange): number {
  return Number(range);
}

function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function parseGaDate(raw: string): string {
  if (raw.length === 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

async function runReport(opts: {
  startDate: string;
  endDate: string;
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  orderBys?: Array<
    | { metric: { metricName: string }; desc?: boolean }
    | { dimension: { dimensionName: string }; desc?: boolean }
  >;
  limit?: number;
}) {
  const property = `properties/${getGaPropertyId()}`;
  const [response] = await getClient().runReport({
    property,
    dateRanges: [{ startDate: opts.startDate, endDate: opts.endDate }],
    dimensions: opts.dimensions,
    metrics: opts.metrics,
    orderBys: opts.orderBys,
    limit: opts.limit,
  });
  return response;
}

const cache = new Map<string, { at: number; report: AnalyticsReport }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function fetchAnalyticsReport(
  range: AnalyticsRange,
): Promise<AnalyticsReport> {
  if (!hasGaDataApiConfig()) {
    throw new Error("GA Data API is not configured");
  }

  const cached = cache.get(range);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.report;
  }

  const days = rangeDays(range);
  const end = new Date();
  const endDate = dateKey(end);
  const startDate = dateKey(addDays(end, -(days - 1)));
  const prevEnd = dateKey(addDays(end, -days));
  const prevStart = dateKey(addDays(end, -(days * 2 - 1)));

  const metrics = [
    { name: "screenPageViews" },
    { name: "activeUsers" },
    { name: "sessions" },
    { name: "averageSessionDuration" },
  ];

  const [current, previous, trendRes, pagesRes, sourcesRes] = await Promise.all([
    runReport({ startDate, endDate, metrics }),
    runReport({ startDate: prevStart, endDate: prevEnd, metrics }),
    runReport({
      startDate,
      endDate,
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "activeUsers" },
        { name: "sessions" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
    }),
    runReport({
      startDate,
      endDate,
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 15,
    }),
    runReport({
      startDate,
      endDate,
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 15,
    }),
  ]);

  const cur = (current.rows?.[0]?.metricValues ?? []).map((m) =>
    Number(m.value || 0),
  );
  const prev = (previous.rows?.[0]?.metricValues ?? []).map((m) =>
    Number(m.value || 0),
  );

  const views = cur[0] ?? 0;
  const activeUsers = cur[1] ?? 0;
  const sessions = cur[2] ?? 0;
  const avgEngagementSeconds = cur[3] ?? 0;

  const trend: AnalyticsTrendPoint[] = (trendRes.rows ?? []).map((row) => ({
    date: parseGaDate(row.dimensionValues?.[0]?.value ?? ""),
    views: Number(row.metricValues?.[0]?.value || 0),
    activeUsers: Number(row.metricValues?.[1]?.value || 0),
    sessions: Number(row.metricValues?.[2]?.value || 0),
  }));

  const pages: AnalyticsPageRow[] = (pagesRes.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value || "/",
    views: Number(row.metricValues?.[0]?.value || 0),
    activeUsers: Number(row.metricValues?.[1]?.value || 0),
  }));

  const sources: AnalyticsSourceRow[] = (sourcesRes.rows ?? []).map((row) => ({
    source: row.dimensionValues?.[0]?.value || "(direct)",
    medium: row.dimensionValues?.[1]?.value || "(none)",
    sessions: Number(row.metricValues?.[0]?.value || 0),
  }));

  const report: AnalyticsReport = {
    range,
    startDate,
    endDate,
    summary: {
      views,
      activeUsers,
      sessions,
      avgEngagementSeconds,
      viewsChangePct: pctChange(views, prev[0] ?? 0),
      activeUsersChangePct: pctChange(activeUsers, prev[1] ?? 0),
      sessionsChangePct: pctChange(sessions, prev[2] ?? 0),
      avgEngagementChangePct: pctChange(avgEngagementSeconds, prev[3] ?? 0),
    },
    trend,
    pages,
    sources,
    cachedAt: new Date().toISOString(),
  };

  cache.set(range, { at: Date.now(), report });
  return report;
}

export function clearAnalyticsCache(): void {
  cache.clear();
}
