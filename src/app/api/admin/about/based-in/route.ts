import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { nextSortOrder } from "@/lib/admin/about-items";
import { inlineMarkdownToHtml } from "@/lib/admin/content";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const { data, error } = await getSupabaseAdmin()
    .from("about_based_in")
    .select("*")
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true });

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
      location?: string;
      body_md?: string;
    };
    const location = (body.location ?? "").trim();
    if (!location) {
      return NextResponse.json({ error: "場所を入力してください" }, { status: 400 });
    }
    const bodyMd = (body.body_md ?? "").trim();
    const bodyHtml = bodyMd ? inlineMarkdownToHtml(bodyMd) : "";
    const sort_order = await nextSortOrder("about_based_in");

    const { data, error } = await getSupabaseAdmin()
      .from("about_based_in")
      .insert({
        location,
        body_md: bodyMd,
        body_html: bodyHtml,
        sort_order,
        is_deleted: false,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/about/me/");
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
