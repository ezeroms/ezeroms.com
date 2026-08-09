import { NextRequest, NextResponse } from "next/server";
import { hasGaDataApiConfig } from "@/lib/analytics/config";
import { fetchAnalyticsReport } from "@/lib/analytics/report";
import { getSessionUser } from "@/lib/supabase/auth";
import type { AnalyticsRange } from "@/types/analytics";

function parseRange(raw: string | null): AnalyticsRange {
  if (raw === "1" || raw === "30" || raw === "90" || raw === "7") return raw;
  return "7";
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasGaDataApiConfig()) {
    return NextResponse.json(
      {
        error: "GA Data API is not configured",
        code: "GA_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const range = parseRange(request.nextUrl.searchParams.get("range"));

  try {
    const report = await fetchAnalyticsReport(range);
    return NextResponse.json({ report });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load analytics" },
      { status: 500 },
    );
  }
}
