import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { markdownToHtml } from "@/lib/admin/content";
import {
  getPhotoGallery,
  isPhotoGalleryId,
} from "@/lib/content/photo-galleries";
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
  const { gallery, slug } = await params;
  const auth = await requireAdmin(gallery);
  if (auth.error) return auth.error;

  const { data, error } = await getSupabaseAdmin()
    .from(auth.galleryId)
    .select("*")
    .eq("slug", slug)
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
  const { gallery, slug } = await params;
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

    const status =
      body.status === "draft"
        ? "draft"
        : body.status === "archived"
          ? "archived"
          : "published";
    const caption = (body.caption ?? "").trim();
    const now = new Date().toISOString();

    const { data: existing } = await getSupabaseAdmin()
      .from(auth.galleryId)
      .select("published_at")
      .eq("slug", slug)
      .maybeSingle();

    const row = {
      title,
      date: dateIso,
      location: (body.location ?? "").trim() || null,
      camera: (body.camera ?? "").trim() || null,
      image_url: imageUrl,
      photo_tag: [] as string[],
      body_html: caption ? markdownToHtml(caption) : "",
      status,
      published_at:
        status === "published"
          ? (existing?.published_at ?? now)
          : existing?.published_at ?? null,
    };

    const { data, error } = await getSupabaseAdmin()
      .from(auth.galleryId)
      .update(row)
      .eq("slug", slug)
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

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { gallery, slug } = await params;
  const auth = await requireAdmin(gallery);
  if (auth.error) return auth.error;
  const g = getPhotoGallery(auth.galleryId);

  const { error } = await getSupabaseAdmin()
    .from(auth.galleryId)
    .delete()
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath(g.basePath);
  return NextResponse.json({ ok: true, slug });
}
