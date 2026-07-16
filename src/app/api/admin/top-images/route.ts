import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import { listTopImages } from "@/lib/content/queries";

/**
 * Admin: top images CRUD (Bearer REVALIDATE_SECRET until Auth is wired).
 *
 * GET  /api/admin/top-images/  — list published (and all via ?all=1 later)
 * POST /api/admin/top-images/  — multipart: file, optional slug/alt/sort_order
 * DELETE /api/admin/top-images/?slug=… — soft-archive + remove storage object
 */
function assertAdmin(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const token = auth?.replace(/^Bearer\s+/i, "");
  if (!token || token !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  try {
    const items = await listTopImages();
    return NextResponse.json({ items, total: items.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
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
    const slug =
      String(form.get("slug") || "").trim() ||
      original.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-") ||
      `top-${Date.now()}`;
    const objectPath = `top/${slug}${ext}`;
    const alt = String(form.get("alt") || "Random Image");
    const sortOrder = Number(form.get("sort_order") || 0) || 0;

    const buffer = Buffer.from(await file.arrayBuffer());
    const sb = getSupabaseAdmin();
    const { error: upErr } = await sb.storage.from("media").upload(objectPath, buffer, {
      contentType: file.type || "image/webp",
      upsert: true,
    });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data: pub } = sb.storage.from("media").getPublicUrl(objectPath);
    const row = {
      slug,
      image_url: pub.publicUrl,
      alt,
      sort_order: sortOrder,
      status: "published" as const,
      published_at: new Date().toISOString(),
    };
    const { data, error } = await sb
      .from("top_image")
      .upsert(row, { onConflict: "slug" })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  try {
    const sb = getSupabaseAdmin();
    const { data: existing } = await sb
      .from("top_image")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (existing?.image_url) {
      const marker = "/object/public/media/";
      const idx = String(existing.image_url).indexOf(marker);
      if (idx >= 0) {
        const objectPath = String(existing.image_url).slice(idx + marker.length);
        await sb.storage.from("media").remove([objectPath]);
      }
    }

    const { error } = await sb.from("top_image").delete().eq("slug", slug);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 },
    );
  }
}
