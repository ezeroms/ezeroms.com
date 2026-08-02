import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/auth";

/** Chronicle admin CRUD is not wired yet. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Chronicle admin API is not available yet" },
    { status: 501 },
  );
}

export async function POST() {
  return GET();
}
