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
    .from("column")
    .select(
      "id, slug, title, date, column_category, column_tag, status, published_at, updated_at",
    )
    .eq("is_deleted", false)
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
      title?: string;
      body_md?: string;
      date?: string;
      categories?: string;
      tags?: string;
      og_image?: string;
      status?: "draft" | "published" | "archived";
      slug?: string;
    };

    const title = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "タイトルを入力してください" }, { status: 400 });
    }

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
    const categories = parseTagList(body.categories ?? "");
    const tags = parseTagList(body.tags ?? "");
    const ogImage = (body.og_image ?? "").trim();
    const bodyHtml = markdownToHtml(bodyMd);
    const now = new Date().toISOString();

    const row = {
      slug,
      title,
      date: dateIso,
      column_month: [month],
      column_category: categories,
      column_tag: tags,
      og_image: ogImage,
      body_html: bodyHtml,
      status,
      published_at: status === "published" ? dateIso : null,
      updated_at: now,
      is_deleted: false,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("column")
      .insert(row)
      .select("id, slug, title, date, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/column");
    revalidatePath(`/column/${slug}/`);

    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}
