import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/auth";

export async function POST() {
  try {
    const supabase = await createAuthClient();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Logout failed" },
      { status: 500 },
    );
  }
}
