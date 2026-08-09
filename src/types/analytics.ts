export type AnalyticsRange = "1" | "7" | "30" | "90";

export type AnalyticsMetricSummary = {
  views: number;
  activeUsers: number;
  sessions: number;
  /** Average engagement time in seconds */
  avgEngagementSeconds: number;
  viewsChangePct: number | null;
  activeUsersChangePct: number | null;
  sessionsChangePct: number | null;
  avgEngagementChangePct: number | null;
};

export type AnalyticsTrendPoint = {
  date: string;
  views: number;
  activeUsers: number;
  sessions: number;
};

export type AnalyticsPageRow = {
  path: string;
  /** Document title from GA (pageTitle). Falls back to path when empty. */
  title: string;
  views: number;
  activeUsers: number;
};

export type AnalyticsSourceRow = {
  source: string;
  medium: string;
  sessions: number;
};

export type AnalyticsReport = {
  range: AnalyticsRange;
  startDate: string;
  endDate: string;
  summary: AnalyticsMetricSummary;
  trend: AnalyticsTrendPoint[];
  pages: AnalyticsPageRow[];
  sources: AnalyticsSourceRow[];
  cachedAt: string;
};
