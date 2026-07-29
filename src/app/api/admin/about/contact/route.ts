import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { markdownToHtml } from "@/lib/admin/content";
import {
  ABOUT_CONTACT_CONTENT_SLUG,
  ABOUT_CONTACT_PUBLIC_PATH,
} from "@/lib/content/about-routes";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

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

/** Contact 記事（DB slug = contact）を1件取得 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let { data, error } = await getSupabaseAdmin()
    .from("about")
    .select(
      "id, slug, title, body_md, body_html, og_image, status, published_at, updated_at",
    )
    .eq("slug", ABOUT_CONTACT_CONTENT_SLUG)
    .maybeSingle();

  if (error && /og_image/i.test(error.message)) {
    const fallback = await getSupabaseAdmin()
      .from("about")
      .select(
        "id, slug, title, body_md, body_html, status, published_at, updated_at",
      )
      .eq("slug", ABOUT_CONTACT_CONTENT_SLUG)
      .maybeSingle();
    data = fallback.data
      ? { ...fallback.data, og_image: "" }
      : fallback.data;
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}

/** Contact 記事を保存（タイトル・本文 Markdown・OGP・公開状態） */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      title?: string;
      body_md?: string;
      og_image?: string;
      status?: "draft" | "published" | "archived";
    };

    const title = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json(
        { error: "タイトルを入力してください" },
        { status: 400 },
      );
    }

    const bodyMarkdown = (body.body_md ?? "").trim();
    if (!bodyMarkdown) {
      return NextResponse.json(
        { error: "本文を入力してください" },
        { status: 400 },
      );
    }

    const bodyHtml = markdownToHtml(bodyMarkdown);
    const ogImage = (body.og_image ?? "").trim();
    const status = body.status === "draft" ? "draft" : "published";
    const now = new Date().toISOString();

    const rowWithOg = {
      slug: ABOUT_CONTACT_CONTENT_SLUG,
      title,
      body_md: bodyMarkdown,
      body_html: bodyHtml,
      og_image: ogImage,
      status,
      published_at: status === "published" ? now : null,
      updated_at: now,
    };
    const { og_image: _og, ...rowWithoutOg } = rowWithOg;

    const { data: existing } = await getSupabaseAdmin()
      .from("about")
      .select("id")
      .eq("slug", ABOUT_CONTACT_CONTENT_SLUG)
      .maybeSingle();

    async function writeRow(includeOg: boolean) {
      const row = includeOg ? rowWithOg : rowWithoutOg;
      return existing?.id
        ? getSupabaseAdmin()
            .from("about")
            .update(row)
            .eq("id", existing.id)
            .select("id, slug, title, body_md, status, updated_at")
            .single()
        : getSupabaseAdmin()
            .from("about")
            .insert(row)
            .select("id, slug, title, body_md, status, updated_at")
            .single();
    }

    let { data, error } = await writeRow(true);
    if (error && /og_image/i.test(error.message)) {
      ({ data, error } = await writeRow(false));
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath(ABOUT_CONTACT_PUBLIC_PATH);
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
