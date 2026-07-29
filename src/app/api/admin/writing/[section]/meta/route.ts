import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getWritingSection,
  isWritingSectionId,
  isWritingSectionStatus,
} from "@/lib/content/writing-sections";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ section: string }> };

/**
 * PATCH /api/admin/writing/[section]/meta/
 * Writing セクションの表示名・公開状態・OGP を更新する。
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { section: sectionId } = await params;
  if (!isWritingSectionId(sectionId)) {
    return NextResponse.json({ error: "Unknown section" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      label?: string;
      status?: string;
      og_image?: string;
    };

    const defaults = getWritingSection(sectionId);
    const label = (body.label ?? "").trim() || defaults.label;
    const status = isWritingSectionStatus(body.status ?? "")
      ? body.status!
      : defaults.status;
    const og_image =
      typeof body.og_image === "string" ? body.og_image.trim() : "";
    const now = new Date().toISOString();

    const row = {
      id: sectionId,
      label,
      status,
      og_image,
      updated_at: now,
    };

    const { data: existing } = await getSupabaseAdmin()
      .from("writing_section")
      .select("id")
      .eq("id", sectionId)
      .maybeSingle();

    const query = existing?.id
      ? getSupabaseAdmin()
          .from("writing_section")
          .update(row)
          .eq("id", sectionId)
          .select("id, label, status, og_image")
          .single()
      : getSupabaseAdmin()
          .from("writing_section")
          .insert({ ...row, description: defaults.description })
          .select("id, label, status, og_image")
          .single();

    const { data, error } = await query;
    if (error) {
      const message = /writing_section|schema cache|does not exist/i.test(
        error.message,
      )
        ? "writing_section がありません。Supabase SQL Editor で supabase/migrations/20260729120000_section_og_image.sql を実行してください。"
        : error.message;
      return NextResponse.json({ error: message }, { status: 500 });
    }

    revalidatePath(defaults.basePath);
    revalidatePath(defaults.adminPath);
    revalidatePath("/");

    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
