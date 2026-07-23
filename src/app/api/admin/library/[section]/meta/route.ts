import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getLibrarySection,
  isLibrarySectionId,
  isLibrarySectionStatus,
} from "@/lib/content/library-sections";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ section: string }> };

/**
 * PATCH /api/admin/library/[section]/meta/
 * Library セクションの表示名・公開状態を更新する。
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
  if (!isLibrarySectionId(sectionId)) {
    return NextResponse.json({ error: "Unknown section" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      label?: string;
      status?: string;
    };

    const defaults = getLibrarySection(sectionId);
    const label = (body.label ?? "").trim() || defaults.label;
    const status = isLibrarySectionStatus(body.status ?? "")
      ? body.status!
      : defaults.status;
    const now = new Date().toISOString();

    const row = {
      id: sectionId,
      label,
      status,
      updated_at: now,
    };

    const { data: existing } = await getSupabaseAdmin()
      .from("library_section")
      .select("id")
      .eq("id", sectionId)
      .maybeSingle();

    const query = existing?.id
      ? getSupabaseAdmin()
          .from("library_section")
          .update(row)
          .eq("id", sectionId)
          .select("id, label, status")
          .single()
      : getSupabaseAdmin()
          .from("library_section")
          .insert({ ...row, description: "" })
          .select("id, label, status")
          .single();

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
