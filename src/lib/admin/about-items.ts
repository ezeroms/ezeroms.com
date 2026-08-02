import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type AboutItemTable =
  | "about_favorite"
  | "about_based_in"
  | "about_web_link";

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

/** Swap sort_order with neighbor (up/down). */
export async function reorderAboutItem(opts: {
  table: AboutItemTable;
  id: string;
  direction: "up" | "down";
}) {
  const sb = getSupabaseAdmin();
  const { data: current, error: curErr } = await sb
    .from(opts.table)
    .select("id, sort_order")
    .eq("id", opts.id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (curErr) {
    return NextResponse.json({ error: curErr.message }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: neighbors, error: nErr } =
    opts.direction === "up"
      ? await sb
          .from(opts.table)
          .select("id, sort_order")
          .eq("is_deleted", false)
          .lt("sort_order", current.sort_order)
          .order("sort_order", { ascending: false })
          .limit(1)
      : await sb
          .from(opts.table)
          .select("id, sort_order")
          .eq("is_deleted", false)
          .gt("sort_order", current.sort_order)
          .order("sort_order", { ascending: true })
          .limit(1);
  if (nErr) {
    return NextResponse.json({ error: nErr.message }, { status: 500 });
  }
  const neighbor = neighbors?.[0];
  if (!neighbor) {
    return NextResponse.json({ ok: true, id: opts.id });
  }

  const a = current.sort_order as number;
  const b = neighbor.sort_order as number;

  const { error: e1 } = await sb
    .from(opts.table)
    .update({ sort_order: b })
    .eq("id", current.id);
  if (e1) {
    return NextResponse.json({ error: e1.message }, { status: 500 });
  }
  const { error: e2 } = await sb
    .from(opts.table)
    .update({ sort_order: a })
    .eq("id", neighbor.id);
  if (e2) {
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  revalidatePath("/about/me/");
  return NextResponse.json({ ok: true });
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
