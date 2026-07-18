import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  generateContentSlug,
  markdownToHtml,
  parseTagList,
} from "@/lib/admin/content";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

function parseOptionalDate(raw: string | undefined | null): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

function revalidateWorkPaths(slug: string) {
  revalidatePath("/works/creative");
  revalidatePath(`/works/creative/${slug}/`);
  revalidatePath(`/work/${slug}/`);
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("work")
    .select(
      "id, slug, title, date, client, status, published_at, updated_at",
    )
    .eq("is_deleted", false)
    .order("date", { ascending: false })
    .limit(200);

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
      image_url?: string;
      start_date?: string;
      end_date?: string;
      categories?: string;
      tags?: string;
      role?: string;
      client?: string;
      agency?: string;
      og_image?: string;
      status?: "draft" | "published" | "archived";
      slug?: string;
    };

    const title = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "タイトルを入力してください" }, { status: 400 });
    }

    const dateInput = body.date?.trim() || new Date().toISOString();
    const dateIso = new Date(dateInput).toISOString();
    if (Number.isNaN(new Date(dateInput).getTime())) {
      return NextResponse.json({ error: "日付が不正です" }, { status: 400 });
    }

    const startDate = parseOptionalDate(body.start_date);
    const endDate = parseOptionalDate(body.end_date);
    if (body.start_date?.trim() && !startDate) {
      return NextResponse.json({ error: "開始日が不正です" }, { status: 400 });
    }
    if (body.end_date?.trim() && !endDate) {
      return NextResponse.json({ error: "終了日が不正です" }, { status: 400 });
    }

    const status = body.status === "draft" ? "draft" : "published";
    const slug =
      (body.slug?.trim() && /^[a-z0-9-]+$/i.test(body.slug.trim())
        ? body.slug.trim()
        : null) || generateContentSlug();
    const categories = parseTagList(body.categories ?? "");
    const tags = parseTagList(body.tags ?? "");
    const imageUrl = (body.image_url ?? "").trim() || null;
    const ogImage = (body.og_image ?? "").trim();
    const role = (body.role ?? "").trim() || null;
    const client = (body.client ?? "").trim() || null;
    const agency = (body.agency ?? "").trim() || null;
    const bodyMd = (body.body_md ?? "").trim();
    const bodyHtml = markdownToHtml(bodyMd);
    const now = new Date().toISOString();

    const row = {
      slug,
      title,
      date: dateIso,
      image_url: imageUrl,
      start_date: startDate,
      end_date: endDate,
      work_category: categories,
      work_tag: tags,
      work_kind: "commission" as const,
      product_key: null,
      role,
      client,
      agency,
      body_html: bodyHtml,
      og_image: ogImage,
      status,
      published_at: status === "published" ? dateIso : null,
      updated_at: now,
      is_deleted: false,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("work")
      .insert(row)
      .select("id, slug, title, date, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateWorkPaths(slug);

    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}
