import { NextRequest, NextResponse } from "next/server";
import { fetchOpenGraph } from "@/lib/content/fetch-open-graph";
import { getSessionUser } from "@/lib/supabase/auth";

/** Preview / fetch OGP for a URL (admin only). */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url")?.trim() ?? "";
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  try {
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const og = await fetchOpenGraph(url);
  return NextResponse.json({ ok: true, ...og });
}
