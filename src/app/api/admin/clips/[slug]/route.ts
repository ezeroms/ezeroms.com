import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { parseTagList } from "@/lib/admin/content";
import { fetchOpenGraph } from "@/lib/content/fetch-open-graph";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ slug: string }> };

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
    .from("clip")
    .select(
      "id, slug, title, source_url, source_name, date, memo, clip_tag, og_image, og_description, status, published_at, updated_at",
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
      tags: ((data.clip_tag as string[] | null) ?? []).join(", "),
    },
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { slug } = await params;

  try {
    const body = (await request.json()) as {
      title?: string;
      source_url?: string;
      source_name?: string;
      date?: string;
      memo?: string;
      tags?: string;
      status?: "draft" | "published" | "archived";
      og_image?: string;
      og_description?: string;
      refresh_og?: boolean;
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

    const status =
      body.status === "draft"
        ? "draft"
        : body.status === "archived"
          ? "archived"
          : "published";
    const tags = parseTagList(body.tags ?? "");
    const memo = (body.memo ?? "").trim();
    const now = new Date().toISOString();

    const { data: existing, error: findError } = await getSupabaseAdmin()
      .from("clip")
      .select("slug, source_url, source_name, og_image, og_description")
      .eq("slug", slug)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let ogImage = (body.og_image ?? existing.og_image ?? "").trim();
    let ogDescription = (body.og_description ?? existing.og_description ?? "").trim();
    let sourceName = (body.source_name ?? existing.source_name ?? "").trim();
    const urlChanged = existing.source_url !== sourceUrl;
    if (body.refresh_og || urlChanged || !ogImage) {
      const og = await fetchOpenGraph(sourceUrl);
      if (og.image) ogImage = og.image;
      if (og.description) ogDescription = og.description;
      if (og.siteName && (urlChanged || !sourceName)) {
        sourceName = og.siteName;
      }
    }

    const row = {
      title,
      source_url: sourceUrl,
      source_name: sourceName,
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
      .update(row)
      .eq("slug", slug)
      .select("id, slug, title, date, status, og_image")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/clips");

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
  const { error } = await getSupabaseAdmin().from("clip").delete().eq("slug", slug);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidatePath("/clips");
  return NextResponse.json({ ok: true });
}
