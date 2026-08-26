import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePhotoGalleryAdmin } from "@/lib/admin/require-admin";
import {
  getPhotoGallery,
  isPhotoGalleryStatus,
} from "@/lib/content/photo-galleries";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ gallery: string }> };

/**
 * PATCH /api/admin/photos/[gallery]/meta/
 * ギャラリーの表示名・説明文・公開状態・OGP を更新する。
 * description は trim しない（空文字＝説明なし）。Library / Writing / Works の
 * upsertSectionPageSettingsRow とは意図が違うので、ここは専用の upsert。
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { gallery: galleryId } = await params;
  const auth = await requirePhotoGalleryAdmin(galleryId);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      label?: string;
      description?: string;
      status?: string;
      og_image?: string;
    };

    const defaults = getPhotoGallery(auth.galleryId);
    const label = (body.label ?? "").trim() || defaults.label;
    const description =
      typeof body.description === "string" ? body.description : "";
    const status = isPhotoGalleryStatus(body.status ?? "")
      ? body.status
      : defaults.status;
    const og_image =
      typeof body.og_image === "string" ? body.og_image.trim() : "";

    const row = {
      id: auth.galleryId,
      label,
      description,
      status,
      og_image,
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
