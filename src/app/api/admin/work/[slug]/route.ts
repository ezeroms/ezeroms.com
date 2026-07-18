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
    .from("work")
    .select(
      "id, slug, title, date, image_url, start_date, end_date, work_category, work_tag, role, client, agency, body_html, og_image, status, published_at, updated_at",
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

  const bodyMd = htmlToEditableMarkdown((data.body_html as string) ?? "");

  return NextResponse.json({
    item: {
      ...data,
      body_md: bodyMd,
      categories: ((data.work_category as string[] | null) ?? []).join(", "),
      tags: ((data.work_tag as string[] | null) ?? []).join(", "),
      image_url: (data.image_url as string | null) ?? "",
      og_image: (data.og_image as string | null) ?? "",
      role: (data.role as string | null) ?? "",
      client: (data.client as string | null) ?? "",
      agency: (data.agency as string | null) ?? "",
      start_date: data.start_date
        ? String(data.start_date).slice(0, 10)
        : "",
      end_date: data.end_date ? String(data.end_date).slice(0, 10) : "",
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

    const status =
      body.status === "draft"
        ? "draft"
        : body.status === "archived"
          ? "archived"
          : "published";
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

    const { data: existing, error: findError } = await getSupabaseAdmin()
      .from("work")
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
      image_url: imageUrl,
      start_date: startDate,
      end_date: endDate,
      work_category: categories,
      work_tag: tags,
      role,
      client,
      agency,
      body_html: bodyHtml,
      og_image: ogImage,
      status,
      published_at: status === "published" ? dateIso : null,
      updated_at: now,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("work")
      .update(row)
      .eq("slug", slug)
      .select("id, slug, title, date, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateWorkPaths(slug);

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
    .from("work")
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

  revalidateWorkPaths(slug);

  return NextResponse.json({ ok: true, slug });
}
