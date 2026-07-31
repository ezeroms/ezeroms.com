import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasWorkspaceConfig } from "@/lib/workspace/db/server";
import { exchangeCodeForTokens } from "@/lib/workspace/calendar/oauth";
import { clearGoogleEventsCache } from "@/lib/workspace/calendar/events";
import {
  getStoredGoogleToken,
  upsertGoogleTokens,
} from "@/lib/workspace/calendar/tokens";

const STATE_COOKIE = "gcal_oauth_state";

function redirectWithError(message: string) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const url = new URL("/admin/workspace/calendar/", site);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/admin/login/?next=/admin/workspace/calendar/", request.url),
    );
  }
  if (!hasWorkspaceConfig()) {
    return redirectWithError("workspace_db");
  }

  const sp = request.nextUrl.searchParams;
  const code = sp.get("code");
  const state = sp.get("state");
  const oauthError = sp.get("error");

  if (oauthError) {
    return redirectWithError(oauthError);
  }
  if (!code || !state) {
    return redirectWithError("missing_code");
  }

  const cookieStore = await cookies();
  const expected = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  if (!expected || expected !== state) {
    return redirectWithError("invalid_state");
  }

  try {
    const existing = await getStoredGoogleToken();
    const tokens = await exchangeCodeForTokens(code);
    await upsertGoogleTokens(tokens, existing?.refresh_token);
    clearGoogleEventsCache();
  } catch {
    return redirectWithError("token_exchange");
  }

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return NextResponse.redirect(
    new URL("/admin/workspace/calendar/?connected=1", site),
  );
}
