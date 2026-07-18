import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { markdownToHtml } from "@/lib/admin/content";
import {
  getPhotoGallery,
  isPhotoGalleryId,
} from "@/lib/content/photo-galleries";
import {
  isLegacySnapTable,
  resolvePhotoDbTable,
} from "@/lib/content/photo-db";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ gallery: string; slug: string }> };

async function requireAdmin(galleryParam: string) {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasSupabaseConfig()) {
    return {
      error: NextResponse.json({ error: "Supabase not configured" }, { status: 500 }),
    };
  }
  if (!isPhotoGalleryId(galleryParam)) {
    return {
      error: NextResponse.json({ error: "Unknown gallery" }, { status: 404 }),
    };
  }
  return { galleryId: galleryParam };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { gallery: galleryId, slug } = await params;
  const auth = await requireAdmin(galleryId);
  if (auth.error) return auth.error;

  const { table } = await resolvePhotoDbTable(auth.galleryId);
  const { data, error } = await getSupabaseAdmin()
    .from(table)
    .select("*")
    .eq("slug", slug)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { gallery: galleryId, slug } = await params;
  const auth = await requireAdmin(galleryId);
  if (auth.error) return auth.error;
  const galleryMeta = getPhotoGallery(auth.galleryId);
  const { table } = await resolvePhotoDbTable(auth.galleryId);

  try {
    const body = (await request.json()) as {
      slug?: string;
      filename?: string;
      date?: string;
      location?: string;
      camera?: string;
      image_url?: string;
      image_thumb_url?: string;
      caption?: string;
      status?: "draft" | "published" | "archived";
    };

    const imageUrl = (body.image_url ?? "").trim();
    if (!imageUrl) {
      return NextResponse.json({ error: "画像をアップロードしてください" }, { status: 400 });
    }
    const imageThumbUrl = (body.image_thumb_url ?? "").trim() || null;

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

    const nextSlugRaw = (body.slug ?? slug).trim();
    if (!nextSlugRaw) {
      return NextResponse.json({ error: "スラッグを入力してください" }, { status: 400 });
    }
    if (!/^[a-z0-9_-]+$/i.test(nextSlugRaw)) {
      return NextResponse.json(
        { error: "スラッグは半角英数字・ハイフン・アンダースコアのみです" },
        { status: 400 },
      );
    }
    const nextSlug = nextSlugRaw;
    const title = nextSlug;
    const caption = (body.caption ?? "").trim();
    const now = new Date().toISOString();

    const { data: existing } = await getSupabaseAdmin()
      .from(table)
      .select("published_at")
      .eq("slug", slug)
      .eq("is_deleted", false)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (nextSlug !== slug) {
      const { data: collision } = await getSupabaseAdmin()
        .from(table)
        .select("id")
        .eq("slug", nextSlug)
        .eq("is_deleted", false)
        .maybeSingle();
      if (collision) {
        return NextResponse.json(
          { error: "同じスラッグのコンテンツが既にあります" },
          { status: 409 },
        );
      }
    }

    const row: Record<string, unknown> = {
      slug: nextSlug,
      title,
      date: dateIso,
      location: (body.location ?? "").trim() || null,
      camera: (body.camera ?? "").trim() || null,
      image_url: imageUrl,
      body_html: caption ? markdownToHtml(caption) : "",
      status,
      published_at:
        status === "published"
          ? (existing?.published_at ?? now)
          : existing?.published_at ?? null,
    };
    if (!isLegacySnapTable(table)) {
      row.image_thumb_url = imageThumbUrl;
      row.photo_tag = [] as string[];
    }

    const { data, error } = await getSupabaseAdmin()
      .from(table)
      .update(row)
      .eq("slug", slug)
      .eq("is_deleted", false)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath(galleryMeta.basePath);
    revalidatePath(`${galleryMeta.basePath}${slug}/`);
    if (nextSlug !== slug) {
      revalidatePath(`${galleryMeta.basePath}${nextSlug}/`);
    }
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { gallery: galleryId, slug } = await params;
  const auth = await requireAdmin(galleryId);
  if (auth.error) return auth.error;
  const galleryMeta = getPhotoGallery(auth.galleryId);
  const { table } = await resolvePhotoDbTable(auth.galleryId);

  // 論理削除（is_deleted = true）。行自体は残す
  const { data, error } = await getSupabaseAdmin()
    .from(table)
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

  revalidatePath(galleryMeta.basePath);
  revalidatePath(`${galleryMeta.basePath}${slug}/`);
  return NextResponse.json({ ok: true, slug });
}
