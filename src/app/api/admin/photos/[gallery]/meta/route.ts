import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getPhotoGallery,
  isPhotoGalleryId,
  isPhotoGalleryStatus,
} from "@/lib/content/photo-galleries";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ gallery: string }> };

/**
 * PATCH /api/admin/photos/[gallery]/meta/
 * ギャラリーの表示名・説明文・公開状態を更新する。
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { gallery: galleryId } = await params;
  if (!isPhotoGalleryId(galleryId)) {
    return NextResponse.json({ error: "Unknown gallery" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      label?: string;
      description?: string;
      status?: string;
    };

    const defaults = getPhotoGallery(galleryId);
    const label = (body.label ?? "").trim() || defaults.label;
    const description =
      typeof body.description === "string" ? body.description : "";
    const status = isPhotoGalleryStatus(body.status ?? "")
      ? body.status
      : defaults.status;

    const row = {
      id: galleryId,
      label,
      description,
      status,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("photo_gallery")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      const missingStatus =
        /status/i.test(error.message) &&
        /schema cache|column/i.test(error.message);
      return NextResponse.json(
        {
          error: missingStatus
            ? "photo_gallery に status 列がありません。Supabase SQL Editor で supabase/migrations/20260719050000_photo_gallery_status.sql を実行してください。"
            : error.message,
        },
        { status: 500 },
      );
    }

    revalidatePath(defaults.basePath);
    revalidatePath(`${defaults.basePath}`, "layout");
    revalidatePath(defaults.adminPath);
    revalidatePath("/");
    return NextResponse.json({ item: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
