import { NextResponse } from "next/server";
import { requireWorkspaceAdmin } from "@/lib/workspace/api-auth";
import { clearGoogleEventsCache } from "@/lib/workspace/calendar/events";
import { deleteGoogleTokens } from "@/lib/workspace/calendar/tokens";

export async function POST() {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;

  try {
    await deleteGoogleTokens();
    clearGoogleEventsCache();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Disconnect failed" },
      { status: 500 },
    );
  }
}
