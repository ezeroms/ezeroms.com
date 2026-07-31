import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isValidAmazonAffiliateTag } from "@/lib/affiliate/amazon";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/site/ — サイト全体設定（デフォルト OGP・Amazon アフィリエイト）を更新する。
 */
export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as {
      og_image?: string;
      amazon_affiliate_tag?: string;
    };
    const og_image =
      typeof body.og_image === "string" ? body.og_image.trim() : "";
    const amazon_affiliate_tag =
      typeof body.amazon_affiliate_tag === "string"
        ? body.amazon_affiliate_tag.trim()
        : "";

    if (!isValidAmazonAffiliateTag(amazon_affiliate_tag)) {
      return NextResponse.json(
        {
          error:
            "Amazon アフィリエイト ID は英数字・ハイフン・アンダースコアのみ（2〜64文字）です",
        },
        { status: 400 },
      );
    }

    const row = {
      id: "site",
      og_image,
      amazon_affiliate_tag,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await getSupabaseAdmin()
      .from("site_settings")
      .upsert(row, { onConflict: "id" })
      .select("id, og_image, amazon_affiliate_tag")
      .single();

    if (error) {
      const message =
        /og_image|amazon_affiliate_tag|site_settings|schema cache|does not exist/i.test(
          error.message,
        )
          ? "site_settings がありません。Supabase SQL Editor で supabase/migrations/20260729180000_site_settings.sql と 20260801100000_amazon_affiliate_tag.sql を実行してください。"
          : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // アフィリエイトタグ変更は Giants の購入リンク表示に影響する
    revalidatePath("/");
    revalidatePath("/shoulders-of-giants");

    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}
