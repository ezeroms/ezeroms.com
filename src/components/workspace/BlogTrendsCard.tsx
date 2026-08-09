import Link from "next/link";
import { MetricCard } from "@/components/charts/MetricCard";
import { surfaceCard } from "@/lib/site/card-styles";
import type { AnalyticsReport } from "@/types/analytics";

function formatNumber(n: number): string {
  return new Intl.NumberFormat("ja-JP").format(Math.round(n));
}

type Props = {
  report: AnalyticsReport | null;
  configured: boolean;
  error: string | null;
};

export function BlogTrendsCard({ report, configured, error }: Props) {
  return (
    <section className={surfaceCard({ className: "p-4" })}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            ブログ動向（GA・直近24時間）
          </h2>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            公開サイトの閲覧トレンド
          </p>
        </div>
        <Link
          href="/admin/analytics/?range=1"
          className="text-xs text-muted-foreground no-underline hover:underline"
        >
          Analytics を開く
        </Link>
      </div>

      {!configured ? (
        <p className="mt-3 m-0 text-sm text-muted-foreground">
          GA Data API が未設定です。ENV_SETUP.md の{" "}
          <code className="text-xs">GA_PROPERTY_ID</code> などを設定するとここに表示されます。
        </p>
      ) : error ? (
        <p className="mt-3 m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : !report ? (
        <p className="mt-3 m-0 text-sm text-muted-foreground">
          レポートを読み込めませんでした。
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Views"
              value={formatNumber(report.summary.views)}
              change={report.summary.viewsChangePct}
            />
            <MetricCard
              label="Active Users"
              value={formatNumber(report.summary.activeUsers)}
              change={report.summary.activeUsersChangePct}
            />
            <MetricCard
              label="Sessions"
              value={formatNumber(report.summary.sessions)}
              change={report.summary.sessionsChangePct}
            />
          </div>

          <div className={surfaceCard({ className: "overflow-hidden" })}>
            <h3 className="m-0 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              人気ページ
            </h3>
            {report.pages.length === 0 ? (
              <p className="m-0 px-3 py-4 text-sm text-muted-foreground">
                データなし
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-card text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 font-medium">ページ</th>
                      <th className="w-16 px-3 py-2 text-right font-medium">
                        Views
                      </th>
                      <th className="w-16 px-3 py-2 text-right font-medium">
                        Users
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.pages.slice(0, 5).map((p) => (
                      <tr
                        key={p.path}
                        className="border-t border-border bg-card hover:bg-muted/30"
                      >
                        <td className="max-w-[220px] px-3 py-2">
                          <span className="block truncate font-medium">
                            {p.title || p.path}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {p.path}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {formatNumber(p.views)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {formatNumber(p.activeUsers)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="m-0 text-xs text-muted-foreground">
            {report.startDate} 〜 {report.endDate}
          </p>
        </div>
      )}
    </section>
  );
}
