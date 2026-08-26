import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  reorderAboutItem,
  softDeleteAboutItem,
} from "@/lib/admin/about-items";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/admin/require-admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const body = (await request.json()) as {
      label?: string;
      direction?: "up" | "down";
    };

    if (body.direction === "up" || body.direction === "down") {
      return reorderAboutItem({
        table: "about_favorite",
        id,
        direction: body.direction,
      });
    }

    const label = (body.label ?? "").trim();
    if (!label) {
      return NextResponse.json({ error: "項目を入力してください" }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("about_favorite")
      .update({ label })
      .eq("id", id)
      .eq("is_deleted", false)
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

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  const { id } = await params;
  return softDeleteAboutItem({ table: "about_favorite", id });
}
