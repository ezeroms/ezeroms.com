import Link from "next/link";
import { AdminSection, AdminTableScroll } from "@/components/admin/AdminSection";
import { MetricCard } from "@/components/charts/MetricCard";
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
    <AdminSection
      title="ブログ動向（GA・直近24時間）"
      description="公開サイトの閲覧トレンド"
      actions={
        <Link
          href="/admin/analytics/?range=1"
          className="text-xs text-muted-foreground no-underline hover:underline"
        >
          Analytics を開く
        </Link>
      }
    >
      {!configured ? (
        <p className="m-0 text-sm text-muted-foreground">
          GA Data API が未設定です。ENV_SETUP.md の{" "}
          <code className="text-xs">GA_PROPERTY_ID</code> などを設定するとここに表示されます。
        </p>
      ) : error ? (
        <p className="m-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : !report ? (
        <p className="m-0 text-sm text-muted-foreground">
          レポートを読み込めませんでした。
        </p>
      ) : (
        <div className="space-y-4">
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

          <AdminSection title="人気ページ">
            {report.pages.length === 0 ? (
              <p className="m-0 text-sm text-muted-foreground">
                データなし
              </p>
            ) : (
              <AdminTableScroll>
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
              </AdminTableScroll>
            )}
          </AdminSection>

          <p className="m-0 text-xs text-muted-foreground">
            {report.startDate} 〜 {report.endDate}
          </p>
        </div>
      )}
    </AdminSection>
  );
}
