import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  generateContentSlug,
  markdownToHtml,
  monthKeyFromDate,
  parseTagList,
} from "@/lib/admin/content";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("diary")
    .select("id, slug, date, diary_tag, diary_place, status, published_at, updated_at")
    .order("date", { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const body = (await request.json()) as {
      body_md?: string;
      date?: string;
      tags?: string;
      place?: string;
      og_image?: string;
      status?: "draft" | "published" | "archived";
      slug?: string;
    };

    const bodyMd = (body.body_md ?? "").trim();
    if (!bodyMd) {
      return NextResponse.json({ error: "本文を入力してください" }, { status: 400 });
    }

    const dateInput = body.date?.trim() || new Date().toISOString();
    const dateIso = new Date(dateInput).toISOString();
    if (Number.isNaN(new Date(dateInput).getTime())) {
      return NextResponse.json({ error: "日付が不正です" }, { status: 400 });
    }

    const status = body.status === "draft" ? "draft" : "published";
    const slug =
      (body.slug?.trim() && /^[a-z0-9-]+$/i.test(body.slug.trim())
        ? body.slug.trim()
        : null) || generateContentSlug();
    const month = monthKeyFromDate(dateIso);
    const tags = parseTagList(body.tags ?? "");
    const place = body.place?.trim() || null;
    const ogImage = (body.og_image ?? "").trim();
    const bodyHtml = markdownToHtml(bodyMd);
    const now = new Date().toISOString();

    const row = {
      slug,
      date: dateIso,
      diary_month: [month],
      diary_tag: tags,
      diary_place: place,
      og_image: ogImage,
      body_md: bodyMd,
      body_html: bodyHtml,
      status,
      published_at: status === "published" ? dateIso : null,
      updated_at: now,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("diary")
      .insert(row)
      .select("id, slug, date, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/diary");
    revalidatePath(`/diary/${slug}`);
    revalidatePath(`/diary_month/${month}`);

    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}
