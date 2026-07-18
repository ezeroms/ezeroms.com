import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";

export async function searchContent(query: string, limit = 30) {
  if (!hasSupabaseConfig() || !query.trim()) {
    return { diary: [], column: [], chronicle: [], work: [] };
  }
  const q = `%${query.trim()}%`;
  const sb = getSupabaseAdmin();
  const [diary, column, chronicle, work] = await Promise.all([
    sb
      .from("diary")
      .select("slug, date, body_html, diary_tag")
      .eq("status", PUBLISHED)
      .ilike("body_html", q)
      .limit(limit),
    sb
      .from("column")
      .select("slug, title, date, body_html")
      .eq("status", PUBLISHED)
      .ilike("title", q)
      .limit(limit),
    sb
      .from("chronicle")
      .select("slug, title, date, description")
      .eq("status", PUBLISHED)
      .ilike("title", q)
      .limit(limit),
    sb
      .from("work")
      .select("slug, title, date")
      .eq("status", PUBLISHED)
      .ilike("title", q)
      .limit(limit),
  ]);
  return {
    diary: diary.data ?? [],
    column: column.data ?? [],
    chronicle: chronicle.data ?? [],
    work: work.data ?? [],
  };
}

