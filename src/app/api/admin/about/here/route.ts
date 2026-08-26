import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { markdownToHtml } from "@/lib/admin/content";
import {
  ABOUT_HERE_CONTENT_SLUG,
  ABOUT_HERE_PUBLIC_PATH,
} from "@/lib/content/about-routes";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/admin/require-admin";

const SELECT_FULL =
  "id, slug, title, body_md, body_html, intro_md, intro_html, rights_md, rights_html, updates_md, updates_html, og_image, status, published_at, updated_at";
const SELECT_WITHOUT_SECTIONS =
  "id, slug, title, body_md, body_html, og_image, status, published_at, updated_at";
const SELECT_MIN =
  "id, slug, title, body_md, body_html, status, published_at, updated_at";

/** Here 記事（DB slug = site）を1件取得 */
export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const sb = getSupabaseAdmin();
  let { data, error } = await sb
    .from("about")
    .select(SELECT_FULL)
    .eq("slug", ABOUT_HERE_CONTENT_SLUG)
    .maybeSingle();

  if (error && /intro_md|rights_md|updates_md/i.test(error.message)) {
    const fallback = await sb
      .from("about")
      .select(SELECT_WITHOUT_SECTIONS)
      .eq("slug", ABOUT_HERE_CONTENT_SLUG)
      .maybeSingle();
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error && /og_image/i.test(error.message)) {
    const fallback = await sb
      .from("about")
      .select(SELECT_MIN)
      .eq("slug", ABOUT_HERE_CONTENT_SLUG)
      .maybeSingle();
    data = (fallback.data
      ? { ...fallback.data, og_image: "" }
      : fallback.data) as typeof data;
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}

/** Here 記事を保存（3 カード本文・OGP・公開状態） */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      title?: string;
      intro_md?: string;
      rights_md?: string;
      updates_md?: string;
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

    const introMd = (body.intro_md ?? "").trim();
    const rightsMd = (body.rights_md ?? "").trim();
    const updatesMd = (body.updates_md ?? "").trim();
    if (!introMd) {
      return NextResponse.json(
        { error: "「このサイトについて」を入力してください" },
        { status: 400 },
      );
    }

    const introHtml = markdownToHtml(introMd);
    const rightsHtml = rightsMd ? markdownToHtml(rightsMd) : "";
    const updatesHtml = updatesMd ? markdownToHtml(updatesMd) : "";
    const bodyMarkdown = [introMd, rightsMd, updatesMd].filter(Boolean).join("\n\n");
    const bodyHtml = markdownToHtml(bodyMarkdown);
    const ogImage = (body.og_image ?? "").trim();
    const status = body.status === "draft" ? "draft" : "published";
    const now = new Date().toISOString();

    const rowFull = {
      slug: ABOUT_HERE_CONTENT_SLUG,
      title,
      body_md: bodyMarkdown,
      body_html: bodyHtml,
      intro_md: introMd,
      intro_html: introHtml,
      rights_md: rightsMd,
      rights_html: rightsHtml,
      updates_md: updatesMd,
      updates_html: updatesHtml,
      og_image: ogImage,
      status,
      published_at: status === "published" ? now : null,
      updated_at: now,
    };

    const { data: existing } = await getSupabaseAdmin()
      .from("about")
      .select("id")
      .eq("slug", ABOUT_HERE_CONTENT_SLUG)
      .maybeSingle();

    async function writeRow(
      row: Record<string, unknown>,
    ) {
      return existing?.id
        ? getSupabaseAdmin()
            .from("about")
            .update(row)
            .eq("id", existing.id)
            .select("id, slug, title, status, updated_at")
            .single()
        : getSupabaseAdmin()
            .from("about")
            .insert(row)
            .select("id, slug, title, status, updated_at")
            .single();
    }

    let { data, error } = await writeRow(rowFull);
    if (error && /intro_md|rights_md|updates_md/i.test(error.message)) {
      const {
        intro_md: _i,
        intro_html: _ih,
        rights_md: _r,
        rights_html: _rh,
        updates_md: _u,
        updates_html: _uh,
        ...withoutSections
      } = rowFull;
      ({ data, error } = await writeRow(withoutSections));
    }
    if (error && /og_image/i.test(error.message)) {
      const { og_image: _og, ...withoutOg } = rowFull;
      ({ data, error } = await writeRow(withoutOg));
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath(ABOUT_HERE_PUBLIC_PATH);
    revalidatePath("/about/site/");
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
