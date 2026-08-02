"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MetricCard } from "@/components/charts/MetricCard";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { AnalyticsRange, AnalyticsReport } from "@/types/analytics";

const RANGES: { id: AnalyticsRange; label: string }[] = [
  { id: "7", label: "7日" },
  { id: "30", label: "30日" },
  { id: "90", label: "90日" },
];

function formatNumber(n: number): string {
  return new Intl.NumberFormat("ja-JP").format(Math.round(n));
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0秒";
  const s = Math.round(seconds);
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}分${r}秒` : `${m}分`;
}

type Props = {
  initialReport: AnalyticsReport | null;
  initialRange: AnalyticsRange;
  configured: boolean;
  measurementId: string | null;
};

export function AnalyticsBoard({
  initialReport,
  initialRange,
  configured,
  measurementId,
}: Props) {
  const router = useRouter();
  const [range, setRange] = useState<AnalyticsRange>(initialRange);
  const [report, setReport] = useState(initialReport);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRange(next: AnalyticsRange) {
    setRange(next);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/analytics/?range=${encodeURIComponent(next)}`,
      );
      const data = (await res.json()) as {
        report?: AnalyticsReport;
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "読み込みに失敗しました");
      }
      setReport(data.report ?? null);
      router.replace(`/admin/analytics/?range=${next}`, { scroll: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="space-y-3 rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
        <p className="m-0">
          Analytics Data API が未設定です。ENV_SETUP.md の手順で次を設定してください。
        </p>
        <ul className="m-0 list-disc pl-5">
          <li>
            <code className="text-xs">GA_PROPERTY_ID</code>（数字のプロパティ ID）
          </li>
          <li>
            <code className="text-xs">GA_SERVICE_ACCOUNT_EMAIL</code>
          </li>
          <li>
            <code className="text-xs">GA_SERVICE_ACCOUNT_PRIVATE_KEY</code>
          </li>
        </ul>
        {measurementId ? (
          <p className="m-0">
            測定 ID（公開サイト）: <code className="text-xs">{measurementId}</code>
          </p>
        ) : (
          <p className="m-0 text-red-600">
            公開サイトの測定タグ{" "}
            <code className="text-xs">NEXT_PUBLIC_GA_ID</code> も未設定です。
          </p>
        )}
      </div>
    );
  }

  if (!report) {
    return (
      <p className="m-0 text-sm text-muted-foreground">
        レポートを読み込めませんでした。
      </p>
    );
  }

  const s = report.summary;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            disabled={busy}
            onClick={() => loadRange(r.id)}
            className={cn(
              "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
              range === r.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-border-hover hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => loadRange(range)}
        >
          {busy ? "更新中…" : "更新"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {report.startDate} 〜 {report.endDate}
          {measurementId ? ` · ${measurementId}` : ""}
        </span>
      </div>

      {error ? (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Views"
          value={formatNumber(s.views)}
          change={s.viewsChangePct}
        />
        <MetricCard
          label="Active Users"
          value={formatNumber(s.activeUsers)}
          change={s.activeUsersChangePct}
        />
        <MetricCard
          label="Sessions"
          value={formatNumber(s.sessions)}
          change={s.sessionsChangePct}
        />
        <MetricCard
          label="Avg Engagement"
          value={formatDuration(s.avgEngagementSeconds)}
          change={s.avgEngagementChangePct}
          hint="平均セッション時間"
        />
      </div>

      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          日別 Views
        </h2>
        <TimeSeriesChart
          data={report.trend}
          xKey="date"
          series={[{ key: "views", label: "Views" }]}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            人気ページ
          </h2>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {report.pages.length === 0 ? (
              <li className="text-sm text-muted-foreground">データなし</li>
            ) : (
              report.pages.map((p) => (
                <li
                  key={p.path}
                  className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-sm last:border-0"
                >
                  <span className="min-w-0 truncate font-medium">{p.path}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatNumber(p.views)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            主な流入元
          </h2>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {report.sources.length === 0 ? (
              <li className="text-sm text-muted-foreground">データなし</li>
            ) : (
              report.sources.map((sRow) => (
                <li
                  key={`${sRow.source}/${sRow.medium}`}
                  className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-sm last:border-0"
                >
                  <span className="min-w-0 truncate font-medium">
                    {sRow.source} / {sRow.medium}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatNumber(sRow.sessions)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
