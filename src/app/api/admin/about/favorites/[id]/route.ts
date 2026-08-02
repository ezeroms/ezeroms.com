import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  reorderAboutItem,
  softDeleteAboutItem,
} from "@/lib/admin/about-items";
import { getSessionUser } from "@/lib/supabase/auth";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasSupabaseConfig()) {
    return {
      error: NextResponse.json({ error: "Supabase not configured" }, { status: 500 }),
    };
  }
  return { user };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
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
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  return softDeleteAboutItem({ table: "about_favorite", id });
}
