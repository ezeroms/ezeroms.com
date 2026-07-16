import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  generateContentSlug,
  parseTagList,
} from "@/lib/admin/content";
import { fetchOpenGraph } from "@/lib/content/fetch-open-graph";
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
    .from("clip")
    .select(
      "id, slug, title, source_url, date, memo, clip_tag, og_image, status, published_at, updated_at",
    )
    .order("date", { ascending: false })
    .limit(80);

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
      source_url?: string;
      date?: string;
      memo?: string;
      tags?: string;
      status?: "draft" | "published" | "archived";
      slug?: string;
      og_image?: string;
      og_description?: string;
    };

    const title = (body.title ?? "").trim();
    const sourceUrl = (body.source_url ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "タイトルを入力してください" }, { status: 400 });
    }
    if (!sourceUrl) {
      return NextResponse.json({ error: "出典 URL を入力してください" }, { status: 400 });
    }
    try {
      // eslint-disable-next-line no-new
      new URL(sourceUrl);
    } catch {
      return NextResponse.json({ error: "出典 URL が不正です" }, { status: 400 });
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
    const tags = parseTagList(body.tags ?? "");
    const memo = (body.memo ?? "").trim();
    const now = new Date().toISOString();

    let ogImage = (body.og_image ?? "").trim();
    let ogDescription = (body.og_description ?? "").trim();
    if (!ogImage) {
      const og = await fetchOpenGraph(sourceUrl);
      ogImage = og.image;
      if (!ogDescription) ogDescription = og.description;
    }

    const row = {
      slug,
      title,
      source_url: sourceUrl,
      date: dateIso,
      memo,
      clip_tag: tags,
      og_image: ogImage,
      og_description: ogDescription,
      status,
      published_at: status === "published" ? dateIso : null,
      updated_at: now,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("clip")
      .insert(row)
      .select("id, slug, title, date, status, og_image")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/clips");

    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}
