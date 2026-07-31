import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import {
  buildGoogleAuthUrl,
  hasGoogleCalendarOAuthConfig,
} from "@/lib/workspace/calendar/oauth";

const STATE_COOKIE = "gcal_oauth_state";

export async function GET() {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  if (!hasGoogleCalendarOAuthConfig()) {
    return NextResponse.json(
      {
        error: "Google OAuth is not configured",
        code: "GOOGLE_OAUTH_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(buildGoogleAuthUrl(state));
}
