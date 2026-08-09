import { AdminContent } from "@/components/admin/AdminContent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AnalyticsBoard } from "@/components/admin/AnalyticsBoard";
import { Alert } from "@/components/ui/alert";
import { findAdminNavItem } from "@/lib/admin/nav";
import {
  hasGaDataApiConfig,
  hasGaMeasurementId,
} from "@/lib/analytics/config";
import { fetchAnalyticsReport } from "@/lib/analytics/report";
import { getSessionUser } from "@/lib/supabase/auth";
import type { AnalyticsRange, AnalyticsReport } from "@/types/analytics";

export const dynamic = "force-dynamic";

const navItem = findAdminNavItem("/admin/analytics/")!;

function parseRange(raw: string | undefined): AnalyticsRange {
  if (raw === "1" || raw === "30" || raw === "90" || raw === "7") return raw;
  return "7";
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await getSessionUser();
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const configured = hasGaDataApiConfig();
  const measurementId = process.env.NEXT_PUBLIC_GA_ID?.trim() || null;

  let report: AnalyticsReport | null = null;
  let loadError: string | null = null;

  if (configured) {
    try {
      report = await fetchAnalyticsReport(range);
    } catch (e) {
      loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
    }
  }

  return (
    <AdminContent width="wide">
      <AdminPageHeader
        title={navItem.label}
        description={navItem.description}
      />
      {!hasGaMeasurementId() ? (
        <Alert className="mb-4">
          公開サイトの測定タグが未設定です。本番・ローカルに{" "}
          <code className="text-xs">NEXT_PUBLIC_GA_ID=G-K021MTL6NX</code>{" "}
          を入れてください。
        </Alert>
      ) : null}
      {loadError ? (
        <Alert variant="destructive" className="mb-4">
          {loadError}
        </Alert>
      ) : null}
      <AnalyticsBoard
        initialReport={report}
        initialRange={range}
        configured={configured}
        measurementId={measurementId}
      />
    </AdminContent>
  );
}
