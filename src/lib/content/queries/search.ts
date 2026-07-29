import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import type { SearchScopeId } from "@/lib/content/search-scope";
import { getSearchScope } from "@/lib/content/search-scope";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";

export type SearchGroup = {
  scope: SearchScopeId;
  label: string;
  /** Full content rows for list-card rendering */
  records: Record<string, unknown>[];
};

export type SearchContentResult = {
  query: string;
  scope: SearchScopeId;
  groups: SearchGroup[];
};

function empty(query: string, scope: SearchScopeId): SearchContentResult {
  return { query, scope, groups: [] };
}

function patternOf(query: string): string {
  return `%${query}%`;
}

function dedupeBySlug(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const row of rows) {
    const slug = String(row.slug ?? "");
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(row);
  }
  return out;
}

function asGroup(
  scope: SearchScopeId,
  records: Record<string, unknown>[],
): SearchGroup {
  return {
    scope,
    label: getSearchScope(scope).label,
    records,
  };
}

async function searchPhotoGallery(
  gallery: PhotoGalleryId,
  query: string,
  limit: number,
): Promise<Record<string, unknown>[]> {
  const sb = getSupabaseAdmin();
  const pattern = patternOf(query);
  const [byTitle, byLocation] = await Promise.all([
    sb
      .from(gallery)
      .select("*")
      .eq("status", PUBLISHED)
      .eq("is_deleted", false)
      .ilike("title", pattern)
      .order("date", { ascending: false })
      .limit(limit),
    sb
      .from(gallery)
      .select("*")
      .eq("status", PUBLISHED)
      .eq("is_deleted", false)
      .ilike("location", pattern)
      .order("date", { ascending: false })
      .limit(limit),
  ]);
  return dedupeBySlug([
    ...((byTitle.data ?? []) as Record<string, unknown>[]),
    ...((byLocation.data ?? []) as Record<string, unknown>[]),
  ]).slice(0, limit);
}

/**
 * スコープ内だけを検索し、一覧カード用のフルレコードを返す。
 */
export async function searchContent(
  query: string,
  scope: SearchScopeId = "all",
  limit = 40,
): Promise<SearchContentResult> {
  const trimmed = query.trim();
  if (!hasSupabaseConfig() || !trimmed) {
    return empty(trimmed, scope);
  }

  const sb = getSupabaseAdmin();
  const pattern = patternOf(trimmed);

  if (scope === "notes") {
    const { data } = await sb
      .from("diary")
      .select("*")
      .eq("status", PUBLISHED)
      .eq("is_deleted", false)
      .ilike("body_html", pattern)
      .order("date", { ascending: false })
      .limit(limit);
    return {
      query: trimmed,
      scope,
      groups: [asGroup("notes", (data ?? []) as Record<string, unknown>[])],
    };
  }

  if (scope === "column") {
    const [byTitle, byBody] = await Promise.all([
      sb
        .from("column")
        .select("*")
        .eq("status", PUBLISHED)
        .eq("is_deleted", false)
        .ilike("title", pattern)
        .order("date", { ascending: false })
        .limit(limit),
      sb
        .from("column")
        .select("*")
        .eq("status", PUBLISHED)
        .eq("is_deleted", false)
        .ilike("body_html", pattern)
        .order("date", { ascending: false })
        .limit(limit),
    ]);
    return {
      query: trimmed,
      scope,
      groups: [
        asGroup(
          "column",
          dedupeBySlug([
            ...((byTitle.data ?? []) as Record<string, unknown>[]),
            ...((byBody.data ?? []) as Record<string, unknown>[]),
          ]).slice(0, limit),
        ),
      ],
    };
  }

  if (scope === "smile" || scope === "jumpai" || scope === "tabekake") {
    return {
      query: trimmed,
      scope,
      groups: [
        asGroup(scope, await searchPhotoGallery(scope, trimmed, limit)),
      ],
    };
  }

  if (scope === "creative") {
    const [byTitle, byBody] = await Promise.all([
      sb
        .from("work")
        .select("*")
        .eq("status", PUBLISHED)
        .eq("is_deleted", false)
        .ilike("title", pattern)
        .order("date", { ascending: false })
        .limit(limit),
      sb
        .from("work")
        .select("*")
        .eq("status", PUBLISHED)
        .eq("is_deleted", false)
        .ilike("body_html", pattern)
        .order("date", { ascending: false })
        .limit(limit),
    ]);
    return {
      query: trimmed,
      scope,
      groups: [
        asGroup(
          "creative",
          dedupeBySlug([
            ...((byTitle.data ?? []) as Record<string, unknown>[]),
            ...((byBody.data ?? []) as Record<string, unknown>[]),
          ]).slice(0, limit),
        ),
      ],
    };
  }

  if (scope === "experience") {
    const [byOrg, byTitle, bySummary] = await Promise.all([
      sb
        .from("experience")
        .select("*")
        .eq("status", PUBLISHED)
        .ilike("organization", pattern)
        .limit(limit),
      sb
        .from("experience")
        .select("*")
        .eq("status", PUBLISHED)
        .ilike("title", pattern)
        .limit(limit),
      sb
        .from("experience")
        .select("*")
        .eq("status", PUBLISHED)
        .ilike("summary", pattern)
        .limit(limit),
    ]);
    return {
      query: trimmed,
      scope,
      groups: [
        asGroup(
          "experience",
          dedupeBySlug([
            ...((byOrg.data ?? []) as Record<string, unknown>[]),
            ...((byTitle.data ?? []) as Record<string, unknown>[]),
            ...((bySummary.data ?? []) as Record<string, unknown>[]),
          ]).slice(0, limit),
        ),
      ],
    };
  }

  if (scope === "clips") {
    const [byTitle, byMemo] = await Promise.all([
      sb
        .from("clip")
        .select("*")
        .eq("status", PUBLISHED)
        .ilike("title", pattern)
        .order("date", { ascending: false })
        .limit(limit),
      sb
        .from("clip")
        .select("*")
        .eq("status", PUBLISHED)
        .ilike("memo", pattern)
        .order("date", { ascending: false })
        .limit(limit),
    ]);
    return {
      query: trimmed,
      scope,
      groups: [
        asGroup(
          "clips",
          dedupeBySlug([
            ...((byTitle.data ?? []) as Record<string, unknown>[]),
            ...((byMemo.data ?? []) as Record<string, unknown>[]),
          ]).slice(0, limit),
        ),
      ],
    };
  }

  if (scope === "giants") {
    const [byBook, byAuthor, byBody] = await Promise.all([
      sb
        .from("shoulders_of_giants")
        .select("*")
        .eq("status", PUBLISHED)
        .ilike("book_title", pattern)
        .limit(limit),
      sb
        .from("shoulders_of_giants")
        .select("*")
        .eq("status", PUBLISHED)
        .ilike("author", pattern)
        .limit(limit),
      sb
        .from("shoulders_of_giants")
        .select("*")
        .eq("status", PUBLISHED)
        .ilike("body_html", pattern)
        .limit(limit),
    ]);
    return {
      query: trimmed,
      scope,
      groups: [
        asGroup(
          "giants",
          dedupeBySlug([
            ...((byBook.data ?? []) as Record<string, unknown>[]),
            ...((byAuthor.data ?? []) as Record<string, unknown>[]),
            ...((byBody.data ?? []) as Record<string, unknown>[]),
          ]).slice(0, limit),
        ),
      ],
    };
  }

  if (scope === "chronicle") {
    const [byTitle, byDesc] = await Promise.all([
      sb
        .from("chronicle")
        .select("*")
        .eq("status", PUBLISHED)
        .ilike("title", pattern)
        .order("date", { ascending: false })
        .limit(limit),
      sb
        .from("chronicle")
        .select("*")
        .eq("status", PUBLISHED)
        .ilike("description", pattern)
        .order("date", { ascending: false })
        .limit(limit),
    ]);
    return {
      query: trimmed,
      scope,
      groups: [
        asGroup(
          "chronicle",
          dedupeBySlug([
            ...((byTitle.data ?? []) as Record<string, unknown>[]),
            ...((byDesc.data ?? []) as Record<string, unknown>[]),
          ]).slice(0, limit),
        ),
      ],
    };
  }

  if (scope === "media-coverage") {
    const { data } = await sb
      .from("media_coverage")
      .select("*")
      .eq("status", PUBLISHED)
      .ilike("title", pattern)
      .order("date", { ascending: false })
      .limit(limit);
    return {
      query: trimmed,
      scope,
      groups: [
        asGroup("media-coverage", (data ?? []) as Record<string, unknown>[]),
      ],
    };
  }

  if (
    scope === "chooning" ||
    scope === "about-me" ||
    scope === "about-here" ||
    scope === "about-contact"
  ) {
    return empty(trimmed, scope);
  }

  // all — 横断
  const per = Math.max(5, Math.ceil(limit / 6));
  const chunks = await Promise.all([
    searchContent(trimmed, "notes", per),
    searchContent(trimmed, "column", per),
    searchContent(trimmed, "creative", per),
    searchContent(trimmed, "chronicle", per),
    searchContent(trimmed, "giants", per),
    searchContent(trimmed, "clips", per),
  ]);

  return {
    query: trimmed,
    scope: "all",
    groups: chunks.flatMap((chunk) => chunk.groups).filter((g) => g.records.length),
  };
}
