/**
 * 管理 API の共通ガード。未ログインは 401、Supabase 未設定は 500。
 */

import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isPhotoGalleryId, type PhotoGalleryId } from "@/lib/content/photo-galleries";
import { getSessionUser } from "@/lib/supabase/auth";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export type AdminSessionOk = { user: User; error?: undefined };
export type AdminSessionErr = { user?: undefined; error: NextResponse };
export type AdminSessionResult = AdminSessionOk | AdminSessionErr;

export async function requireAdminSession(): Promise<AdminSessionResult> {
  const user = await getSessionUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!hasSupabaseConfig()) {
    return {
      error: NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 },
      ),
    };
  }
  return { user };
}

export async function requirePhotoGalleryAdmin(
  galleryParam: string,
): Promise<
  | { galleryId: PhotoGalleryId; error?: undefined }
  | { galleryId?: undefined; error: NextResponse }
> {
  const auth = await requireAdminSession();
  if (auth.error) return auth;
  if (!isPhotoGalleryId(galleryParam)) {
    return {
      error: NextResponse.json({ error: "Unknown gallery" }, { status: 404 }),
    };
  }
  return { galleryId: galleryParam };
}
