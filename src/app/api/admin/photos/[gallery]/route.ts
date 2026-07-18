import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getPhotoGallery,
  isPhotoGalleryId,
} from "@/lib/content/photo-galleries";
import {
  isLegacySnapTable,
  resolvePhotoDbTable,
} from "@/lib/content/photo-db";
import { markdownToHtml } from "@/lib/admin/content";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ gallery: string }> };

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
  const { gallery: galleryId } = await params;
  const auth = await requireAdmin(galleryId);
  if (auth.error) return auth.error;

  const { table } = await resolvePhotoDbTable(auth.galleryId);
  const { data, error } = await getSupabaseAdmin()
    .from(table)
    .select("*")
    .eq("is_deleted", false)
    .order("date", { ascending: false })
    .limit(80);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { gallery: galleryId } = await params;
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

    const status = body.status === "draft" ? "draft" : "published";
    const slugRaw = (body.slug ?? "").trim();
    if (!slugRaw) {
      return NextResponse.json({ error: "スラッグを入力してください" }, { status: 400 });
    }
    if (!/^[a-z0-9_-]+$/i.test(slugRaw)) {
      return NextResponse.json(
        { error: "スラッグは半角英数字・ハイフン・アンダースコアのみです" },
        { status: 400 },
      );
    }
    const slug = slugRaw;
    // title カラムは NOT NULL のため slug を格納（公開 UI では未使用）
    const title = slug;
    const caption = (body.caption ?? "").trim();
    const now = new Date().toISOString();

    // 旧 snap には photo_tag / image_thumb_url が無い
    const row: Record<string, unknown> = {
      slug,
      title,
      date: dateIso,
      location: (body.location ?? "").trim() || null,
      camera: (body.camera ?? "").trim() || null,
      image_url: imageUrl,
      body_html: caption ? markdownToHtml(caption) : "",
      status,
      published_at: status === "published" ? now : null,
      is_deleted: false,
    };
    if (!isLegacySnapTable(table)) {
      row.image_thumb_url = imageThumbUrl;
      row.photo_tag = [] as string[];
    }

    const { data, error } = await getSupabaseAdmin()
      .from(table)
      .insert(row)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath(galleryMeta.basePath);
    revalidatePath(`${galleryMeta.basePath}${slug}/`);
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
