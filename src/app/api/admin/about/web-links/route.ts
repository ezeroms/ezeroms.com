import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { nextSortOrder } from "@/lib/admin/about-items";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const { data, error } = await getSupabaseAdmin()
    .from("about_web_link")
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
    const body = (await request.json()) as { label?: string; url?: string };
    const label = (body.label ?? "").trim();
    const url = (body.url ?? "").trim();
    if (!label) {
      return NextResponse.json({ error: "名前を入力してください" }, { status: 400 });
    }
    if (!url) {
      return NextResponse.json({ error: "URL を入力してください" }, { status: 400 });
    }

    const sort_order = await nextSortOrder("about_web_link");
    const { data, error } = await getSupabaseAdmin()
      .from("about_web_link")
      .insert({ label, url, sort_order, is_deleted: false })
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
