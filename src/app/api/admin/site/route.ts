import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/site/ — サイト全体設定（デフォルト OGP）を更新する。
 */
export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as { og_image?: string };
    const og_image =
      typeof body.og_image === "string" ? body.og_image.trim() : "";

    const row = {
      id: "site",
      og_image,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await getSupabaseAdmin()
      .from("site_settings")
      .upsert(row, { onConflict: "id" })
      .select("id, og_image")
      .single();

    if (error) {
      const message = /og_image|site_settings|schema cache|does not exist/i.test(
        error.message,
      )
        ? "site_settings がありません。Supabase SQL Editor で supabase/migrations/20260729180000_site_settings.sql を実行してください。"
        : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}
