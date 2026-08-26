import { NextRequest, NextResponse } from "next/server";
import {
  generateContentSlug,
  markdownToHtml,
  parseTagList,
} from "@/lib/admin/content";
import { revalidateGiantsPaths } from "@/lib/admin/giants";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const { data, error } = await getSupabaseAdmin()
    .from("shoulders_of_giants")
    .select(
      "id, slug, giants_tag, book_title, author, publisher, published_year, citation_override, source_url, status, published_at, updated_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      body_md?: string;
      tags?: string;
      topics?: string;
      book_title?: string;
      author?: string;
      publisher?: string;
      published_year?: string;
      citation_override?: string;
      source_url?: string;
      og_image?: string;
      status?: "draft" | "published" | "archived";
      slug?: string;
    };

    const bodyMd = (body.body_md ?? "").trim();
    if (!bodyMd) {
      return NextResponse.json(
        { error: "引用本文を入力してください" },
        { status: 400 },
      );
    }

    const source_url = (body.source_url ?? "").trim() || null;

    const status = body.status === "draft" ? "draft" : "published";
    const slug =
      (body.slug?.trim() && /^[a-z0-9-]+$/i.test(body.slug.trim())
        ? body.slug.trim()
        : null) || generateContentSlug();
    // 旧クライアントは `topics` を送る。現在の正式名は tags。
    const tags = parseTagList(body.tags ?? body.topics ?? "");
    const now = new Date().toISOString();

    const row = {
      slug,
      giants_tag: tags,
      book_title: (body.book_title ?? "").trim() || null,
      author: (body.author ?? "").trim() || null,
      publisher: (body.publisher ?? "").trim() || null,
      published_year: (body.published_year ?? "").trim() || null,
      citation_override: (body.citation_override ?? "").trim() || null,
      source_url,
      body_html: markdownToHtml(bodyMd),
      og_image: (body.og_image ?? "").trim(),
      status,
      published_at: status === "published" ? now : null,
      updated_at: now,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("shoulders_of_giants")
      .insert(row)
      .select("id, slug, status, source_url")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateGiantsPaths(slug);
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}
