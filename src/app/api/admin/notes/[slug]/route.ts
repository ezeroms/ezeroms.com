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
    .from("diary")
    .select(
      "id, slug, date, diary_tag, diary_place, status, body_html, body_md, published_at, updated_at",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bodyMd =
    (data.body_md as string)?.trim() ||
    htmlToEditableMarkdown((data.body_html as string) ?? "");

  return NextResponse.json({
    item: {
      ...data,
      body_md: bodyMd,
      tags: ((data.diary_tag as string[] | null) ?? []).join(", "),
      place: (data.diary_place as string | null) ?? "",
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
      date?: string;
      tags?: string;
      place?: string;
      status?: "draft" | "published" | "archived";
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

    const status =
      body.status === "draft"
        ? "draft"
        : body.status === "archived"
          ? "archived"
          : "published";
    const month = monthKeyFromDate(dateIso);
    const tags = parseTagList(body.tags ?? "");
    const place = body.place?.trim() || null;
    const bodyHtml = markdownToHtml(bodyMd);
    const now = new Date().toISOString();

    const { data: existing, error: findError } = await getSupabaseAdmin()
      .from("diary")
      .select("slug, diary_month")
      .eq("slug", slug)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const oldMonths = (existing.diary_month as string[] | null) ?? [];

    const row = {
      date: dateIso,
      diary_month: [month],
      diary_tag: tags,
      diary_place: place,
      body_md: bodyMd,
      body_html: bodyHtml,
      status,
      published_at: status === "published" ? dateIso : null,
      updated_at: now,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("diary")
      .update(row)
      .eq("slug", slug)
      .select("id, slug, date, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/diary");
    revalidatePath(`/diary/${slug}`);
    revalidatePath(`/diary_month/${month}`);
    for (const m of oldMonths) {
      if (m !== month) revalidatePath(`/diary_month/${m}`);
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}
