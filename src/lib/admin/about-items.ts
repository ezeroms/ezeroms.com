import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type AboutItemTable = "about_web_link";

export async function softDeleteAboutItem(opts: {
  table: AboutItemTable;
  id: string;
  revalidatePaths?: string[];
}) {
  const soft = await getSupabaseAdmin()
    .from(opts.table)
    .update({ is_deleted: true })
    .eq("id", opts.id)
    .eq("is_deleted", false)
    .select("id")
    .maybeSingle();

  if (!soft.error && soft.data) {
    for (const path of opts.revalidatePaths ?? ["/about/me/"]) {
      revalidatePath(path);
    }
    return NextResponse.json({ ok: true, id: opts.id });
  }

  if (soft.error && !/is_deleted/i.test(soft.error.message)) {
    return NextResponse.json({ error: soft.error.message }, { status: 500 });
  }

  const hard = await getSupabaseAdmin()
    .from(opts.table)
    .delete()
    .eq("id", opts.id)
    .select("id")
    .maybeSingle();

  if (hard.error) {
    return NextResponse.json({ error: hard.error.message }, { status: 500 });
  }
  if (!hard.data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  for (const path of opts.revalidatePaths ?? ["/about/me/"]) {
    revalidatePath(path);
  }
  return NextResponse.json({ ok: true, id: opts.id });
}

export async function nextSortOrder(table: AboutItemTable): Promise<number> {
  const { data } = await getSupabaseAdmin()
    .from(table)
    .select("sort_order")
    .eq("is_deleted", false)
    .order("sort_order", { ascending: false })
    .limit(1);
  const max = data?.[0]?.sort_order;
  return typeof max === "number" ? max + 1 : 0;
}
