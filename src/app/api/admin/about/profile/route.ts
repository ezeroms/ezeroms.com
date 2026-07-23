import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { markdownToHtml } from "@/lib/admin/content";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasSupabaseConfig()) {
    return {
      error: NextResponse.json({ error: "Supabase not configured" }, { status: 500 }),
    };
  }
  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { data, error } = await getSupabaseAdmin()
    .from("about_profile")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      sub_name?: string;
      bio_md?: string;
      cover_image?: string;
      status?: "draft" | "published" | "archived";
    };

    const name = (body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "名前を入力してください" }, { status: 400 });
    }
    const subName = (body.sub_name ?? "").trim();
    const bioMd = (body.bio_md ?? "").trim();
    const bioHtml = bioMd ? markdownToHtml(bioMd) : "";
    const coverImage =
      (body.cover_image ?? "").trim() || "/images/about/profile.webp";
    const status = body.status === "draft" ? "draft" : "published";
    const now = new Date().toISOString();

    const row = {
      name,
      sub_name: subName,
      bio_md: bioMd,
      bio_html: bioHtml,
      cover_image: coverImage,
      status,
      published_at: status === "published" ? now : null,
    };

    let targetId = (body.id ?? "").trim();
    if (!targetId) {
      const { data: existing } = await getSupabaseAdmin()
        .from("about_profile")
        .select("id")
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      targetId = existing?.id ?? "";
    }

    let data;
    let error;
    if (targetId) {
      const res = await getSupabaseAdmin()
        .from("about_profile")
        .update(row)
        .eq("id", targetId)
        .select("*")
        .single();
      data = res.data;
      error = res.error;
    } else {
      const res = await getSupabaseAdmin()
        .from("about_profile")
        .insert({ ...row, is_deleted: false })
        .select("*")
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/about/me/");
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
