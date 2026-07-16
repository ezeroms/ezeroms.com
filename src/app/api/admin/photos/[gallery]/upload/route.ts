import { NextRequest, NextResponse } from "next/server";
import { generateContentSlug } from "@/lib/admin/content";
import { isPhotoGalleryId } from "@/lib/content/photo-galleries";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ gallery: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { gallery } = await params;
  if (!isPhotoGalleryId(gallery)) {
    return NextResponse.json({ error: "Unknown gallery" }, { status: 404 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const original = file.name || "upload.webp";
    const ext = original.includes(".")
      ? original.slice(original.lastIndexOf("."))
      : ".webp";
    const base =
      original.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-") ||
      generateContentSlug(8);
    const objectPath = `photos/${gallery}/${base}-${Date.now()}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const sb = getSupabaseAdmin();
    const { error: upErr } = await sb.storage.from("media").upload(objectPath, buffer, {
      contentType: file.type || "image/webp",
      upsert: false,
    });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data: pub } = sb.storage.from("media").getPublicUrl(objectPath);
    return NextResponse.json({ image_url: pub.publicUrl, path: objectPath });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 },
    );
  }
}
