import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generateContentSlug, markdownToHtml } from "@/lib/admin/content";
import {
  getPhotoGallery,
  isPhotoGalleryId,
} from "@/lib/content/photo-galleries";
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
  const { gallery } = await params;
  const auth = await requireAdmin(gallery);
  if (auth.error) return auth.error;

  const { data, error } = await getSupabaseAdmin()
    .from(auth.galleryId)
    .select(
      "id, slug, title, date, location, camera, image_url, status, published_at, updated_at",
    )
    .order("date", { ascending: false })
    .limit(80);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { gallery } = await params;
  const auth = await requireAdmin(gallery);
  if (auth.error) return auth.error;
  const g = getPhotoGallery(auth.galleryId);

  try {
    const body = (await request.json()) as {
      title?: string;
      date?: string;
      location?: string;
      camera?: string;
      image_url?: string;
      caption?: string;
      status?: "draft" | "published" | "archived";
      slug?: string;
    };

    const title = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "タイトルを入力してください" }, { status: 400 });
    }

    const imageUrl = (body.image_url ?? "").trim();
    if (!imageUrl) {
      return NextResponse.json({ error: "画像をアップロードしてください" }, { status: 400 });
    }

    const dateInput = body.date?.trim() || new Date().toISOString();
    const dateIso = new Date(dateInput).toISOString();
    if (Number.isNaN(new Date(dateInput).getTime())) {
      return NextResponse.json({ error: "日付が不正です" }, { status: 400 });
    }

    const status = body.status === "draft" ? "draft" : "published";
    const slug =
      (body.slug?.trim() && /^[a-z0-9-]+$/i.test(body.slug.trim())
        ? body.slug.trim()
        : null) || generateContentSlug();
    const caption = (body.caption ?? "").trim();
    const now = new Date().toISOString();

    const row = {
      slug,
      title,
      date: dateIso,
      location: (body.location ?? "").trim() || null,
      camera: (body.camera ?? "").trim() || null,
      image_url: imageUrl,
      photo_tag: [] as string[],
      body_html: caption ? markdownToHtml(caption) : "",
      status,
      published_at: status === "published" ? now : null,
    };

    const { data, error } = await getSupabaseAdmin()
      .from(auth.galleryId)
      .insert(row)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath(g.basePath);
    revalidatePath(`${g.basePath}${slug}/`);
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
