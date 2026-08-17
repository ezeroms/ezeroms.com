import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    const body = (await request.json()) as {
      og_image?: string;
    };
    const og_image =
      typeof body.og_image === "string" ? body.og_image.trim() : "";

    const { data: existing, error: findError } = await getSupabaseAdmin()
      .from("site_settings")
      .select("id")
      .eq("id", "site")
      .maybeSingle();

    if (findError) {
      const message = /site_settings|schema cache|does not exist/i.test(
        findError.message,
      )
        ? "site_settings がありません。Supabase SQL Editor で supabase/migrations/20260729180000_site_settings.sql を実行してください。"
        : findError.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const now = new Date().toISOString();
    const query = existing
      ? getSupabaseAdmin()
          .from("site_settings")
          .update({ og_image, updated_at: now })
          .eq("id", "site")
      : getSupabaseAdmin()
          .from("site_settings")
          .insert({ id: "site", og_image, updated_at: now });

    const { data, error } = await query.select("id, og_image").single();

    if (error) {
      const message = /og_image|site_settings|schema cache|does not exist/i.test(
        error.message,
      )
        ? "site_settings がありません。Supabase SQL Editor で supabase/migrations/20260729180000_site_settings.sql を実行してください。"
        : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    revalidatePath("/");

    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}
