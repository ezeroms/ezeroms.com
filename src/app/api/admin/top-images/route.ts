import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  buildTopImageAlt,
  parseCapturedYear,
} from "@/lib/admin/top-images";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const { data, error } = await getSupabaseAdmin()
    .from("top_image")
    .select("*")
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      slug?: string;
      image_url?: string;
      alt?: string;
      location?: string;
      captured_year?: string | number | null;
      sort_order?: number | string;
      status?: "draft" | "published" | "archived";
    };

    const imageUrl = (body.image_url ?? "").trim();
    if (!imageUrl) {
      return NextResponse.json({ error: "画像をアップロードしてください" }, { status: 400 });
    }

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

    const yearInput = body.captured_year;
    const capturedYear =
      yearInput === null || yearInput === undefined || yearInput === ""
        ? null
        : parseCapturedYear(yearInput);
    if (
      yearInput !== null &&
      yearInput !== undefined &&
      String(yearInput).trim() !== "" &&
      capturedYear === null
    ) {
      return NextResponse.json(
        { error: "年は 1900–2100 の整数で入力してください" },
        { status: 400 },
      );
    }

    const location = (body.location ?? "").trim() || null;
    const status = body.status === "draft" ? "draft" : "published";
    const sortOrder = Number(body.sort_order ?? 0);
    const now = new Date().toISOString();
    const alt = buildTopImageAlt(location, capturedYear, body.alt);

    const row = {
      slug: slugRaw,
      image_url: imageUrl,
      alt,
      location,
      captured_year: capturedYear,
      sort_order: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
      status,
      published_at: status === "published" ? now : null,
      is_deleted: false,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("top_image")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/");
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
