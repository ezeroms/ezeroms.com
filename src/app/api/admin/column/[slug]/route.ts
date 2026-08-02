import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  htmlToEditableMarkdown,
  markdownToHtml,
  monthKeyFromDate,
  parseTagList,
} from "@/lib/admin/content";
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
    .from("column")
    .select(
      "id, slug, title, date, column_category, column_tag, og_image, status, body_html, published_at, updated_at",
    )
    .eq("slug", slug)
    .eq("is_deleted", false)
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
      categories: ((data.column_category as string[] | null) ?? []).join(", "),
      tags: ((data.column_tag as string[] | null) ?? []).join(", "),
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
      body_md?: string;
      date?: string;
      categories?: string;
      tags?: string;
      og_image?: string;
      status?: "draft" | "published" | "archived";
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

    const status =
      body.status === "draft"
        ? "draft"
        : body.status === "archived"
          ? "archived"
          : "published";
    const month = monthKeyFromDate(dateIso);
    const categories = parseTagList(body.categories ?? "");
    const tags = parseTagList(body.tags ?? "");
    const ogImage = (body.og_image ?? "").trim();
    const bodyHtml = markdownToHtml(bodyMd);
    const now = new Date().toISOString();

    const { data: existing, error: findError } = await getSupabaseAdmin()
      .from("column")
      .select("slug")
      .eq("slug", slug)
      .eq("is_deleted", false)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = {
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
    };

    const { data, error } = await getSupabaseAdmin()
      .from("column")
      .update(row)
      .eq("slug", slug)
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
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { slug } = await params;
  const { data, error } = await getSupabaseAdmin()
    .from("column")
    .update({ is_deleted: true })
    .eq("slug", slug)
    .eq("is_deleted", false)
    .select("slug")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidatePath("/column");
  revalidatePath(`/column/${slug}/`);

  return NextResponse.json({ ok: true, slug });
}
