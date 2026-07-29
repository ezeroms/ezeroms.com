import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  htmlToEditableMarkdown,
  markdownToHtml,
  parseTagList,
} from "@/lib/admin/content";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ slug: string }> };

function parseOptionalUrl(raw: string | undefined | null): {
  value: string | null;
  error?: string;
} {
  const v = (raw ?? "").trim();
  if (!v) return { value: null };
  try {
    // eslint-disable-next-line no-new
    new URL(v);
    return { value: v };
  } catch {
    return { value: null, error: "購入リンクの URL が不正です" };
  }
}

function revalidateGiantsPaths(slug: string) {
  revalidatePath("/shoulders-of-giants");
  revalidatePath(`/shoulders-of-giants/${slug}`);
}

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

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { slug } = await params;
  const { data, error } = await getSupabaseAdmin()
    .from("shoulders_of_giants")
    .select(
      "id, slug, topic, book_title, author, publisher, published_year, citation_override, source_url, body_html, og_image, status, published_at, updated_at, created_at",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      ...data,
      body_md: htmlToEditableMarkdown((data.body_html as string) ?? ""),
      topics: ((data.topic as string[] | null) ?? []).join(", "),
    },
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { slug } = await params;

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
    };

    const bodyMd = (body.body_md ?? "").trim();
    if (!bodyMd) {
      return NextResponse.json(
        { error: "引用本文を入力してください" },
        { status: 400 },
      );
    }

    const source = parseOptionalUrl(body.source_url);
    if (source.error) {
      return NextResponse.json({ error: source.error }, { status: 400 });
    }

    const status =
      body.status === "draft"
        ? "draft"
        : body.status === "archived"
          ? "archived"
          : "published";
    const topics = parseTagList(body.topics ?? "");
    const now = new Date().toISOString();

    const { data: existing, error: findError } = await getSupabaseAdmin()
      .from("shoulders_of_giants")
      .select("slug, published_at")
      .eq("slug", slug)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = {
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
      published_at:
        status === "published"
          ? (existing.published_at as string | null) ?? now
          : null,
      updated_at: now,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("shoulders_of_giants")
      .update(row)
      .eq("slug", slug)
      .select("id, slug, status, source_url")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateGiantsPaths(slug);
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { slug } = await params;
  const { error } = await getSupabaseAdmin()
    .from("shoulders_of_giants")
    .delete()
    .eq("slug", slug);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidateGiantsPaths(slug);
  return NextResponse.json({ ok: true });
}
