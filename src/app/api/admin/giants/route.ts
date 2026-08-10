import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  generateContentSlug,
  markdownToHtml,
  parseTagList,
} from "@/lib/admin/content";
import { normalizePurchaseUrl } from "@/lib/affiliate/amazon";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const maxDuration = 30;

function revalidateGiantsPaths(slug?: string) {
  revalidatePath("/shoulders-of-giants");
  if (slug) {
    revalidatePath(`/shoulders-of-giants/${slug}`);
  }
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
    .from("shoulders_of_giants")
    .select(
      "id, slug, topic, book_title, author, publisher, published_year, citation_override, source_url, status, published_at, updated_at, created_at",
    )
    .order("created_at", { ascending: false })
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
      body_md?: string;
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

    const source = await normalizePurchaseUrl(body.source_url);
    if (source.error) {
      return NextResponse.json(
        { error: source.error, debug: source.debug },
        { status: 400 },
      );
    }

    const status = body.status === "draft" ? "draft" : "published";
    const slug =
      (body.slug?.trim() && /^[a-z0-9-]+$/i.test(body.slug.trim())
        ? body.slug.trim()
        : null) || generateContentSlug();
    const topics = parseTagList(body.topics ?? "");
    const now = new Date().toISOString();

    const row = {
      slug,
      topic: topics,
      book_title: (body.book_title ?? "").trim() || null,
      author: (body.author ?? "").trim() || null,
      publisher: (body.publisher ?? "").trim() || null,
      published_year: (body.published_year ?? "").trim() || null,
      citation_override: (body.citation_override ?? "").trim() || null,
      source_url: source.value,
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
