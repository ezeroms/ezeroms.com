import fs from "node:fs";
import path from "node:path";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import {
  dateMatchesMonths,
  dateMatchesWeekdays,
  diaryMatchesMonths,
  diaryMatchesWeekdays,
} from "@/lib/content/notes-filter";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import type {
  About,
  Chronicle,
  Clip,
  Column,
  Diary,
  Experience,
  MediaCoverage,
  Photo,
  ShouldersOfGiants,
  TopImage,
  UiDesignGuidebook,
  Work,
} from "@/types/content";

const PUBLISHED = "published";

function emptyList<T>(): { items: T[]; total: number } {
  return { items: [], total: 0 };
}

/** PostgREST / Postgres when migration not applied yet. */
function isMissingRelationError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { message?: unknown; code?: unknown; details?: unknown };
  const code = String(err.code ?? "");
  const msg = `${err.message ?? ""} ${err.details ?? ""}`;
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    /schema cache|Could not find the table|relation .* does not exist/i.test(
      msg,
    )
  );
}

function logQueryError(label: string, e: unknown) {
  if (isMissingRelationError(e)) return;
  const msg =
    e && typeof e === "object" && "message" in e
      ? String((e as { message: unknown }).message)
      : e;
  console.error(label, msg || e);
}

export async function listDiary(opts?: {
  month?: string;
  months?: string[];
  tag?: string;
  tags?: string[];
  place?: string;
  places?: string[];
  weekdays?: number[];
  limit?: number;
}): Promise<{ items: Diary[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  let q = getSupabaseAdmin()
    .from("diary")
    .select("*", { count: "exact" })
    .eq("status", PUBLISHED)
    .order("date", { ascending: false });

  if (opts?.month) q = q.contains("diary_month", [opts.month]);
  if (opts?.tag) q = q.contains("diary_tag", [opts.tag]);
  if (opts?.tags?.length === 1) q = q.contains("diary_tag", opts.tags);
  else if (opts?.tags && opts.tags.length > 1) {
    q = q.overlaps("diary_tag", opts.tags);
  }
  if (opts?.place) q = q.eq("diary_place", opts.place);
  if (opts?.places?.length === 1) q = q.eq("diary_place", opts.places[0]);
  else if (opts?.places && opts.places.length > 1) {
    q = q.in("diary_place", opts.places);
  }

  // Month / weekday filters need post-processing; avoid early limit
  const needsPost =
    (opts?.months && opts.months.length > 0) ||
    (opts?.weekdays && opts.weekdays.length > 0);
  if (opts?.limit && !needsPost) q = q.limit(opts.limit);

  const { data, error, count } = await q;
  if (error) throw error;

  let items = (data ?? []) as Diary[];

  if (opts?.months?.length) {
    items = items.filter((d) => diaryMatchesMonths(d, opts.months!));
  }
  if (opts?.weekdays?.length) {
    items = items.filter((d) => diaryMatchesWeekdays(d, opts.weekdays!));
  }
  if (opts?.limit && needsPost) {
    items = items.slice(0, opts.limit);
  }

  return {
    items,
    total: needsPost ? items.length : (count ?? items.length),
  };
}

export async function getDiaryBySlug(slug: string): Promise<Diary | null> {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("diary")
    .select("*")
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .maybeSingle();
  if (error) throw error;
  return data as Diary | null;
}

export async function listDiaryMonths(): Promise<string[]> {
  const { items } = await listDiary();
  const set = new Set<string>();
  for (const d of items) {
    for (const m of d.diary_month ?? []) {
      const slash = m.match(/^(\d{4})\/(\d{1,2})(?:\/\d{1,2})?$/);
      set.add(
        slash
          ? `${slash[1]}-${slash[2].padStart(2, "0")}`
          : m,
      );
    }
  }
  return [...set].sort();
}

/** Tags / places for Notes secondary nav (lightweight select). */
export async function listDiaryTaxonomy(): Promise<{
  tags: string[];
  places: string[];
}> {
  if (!hasSupabaseConfig()) return { tags: [], places: [] };
  const { data, error } = await getSupabaseAdmin()
    .from("diary")
    .select("diary_tag, diary_place")
    .eq("status", PUBLISHED);
  if (error) throw error;
  const tags = new Set<string>();
  const places = new Set<string>();
  for (const row of data ?? []) {
    for (const t of (row.diary_tag as string[] | null) ?? []) {
      if (t) tags.add(t);
    }
    const place = row.diary_place as string | null;
    if (place) places.add(place);
  }
  return {
    tags: [...tags].sort((a, b) => a.localeCompare(b, "ja")),
    places: [...places].sort((a, b) => a.localeCompare(b, "ja")),
  };
}

export async function listColumn(opts?: {
  category?: string;
  categories?: string[];
  tag?: string;
  tags?: string[];
  months?: string[];
  weekdays?: number[];
  limit?: number;
}): Promise<{ items: Column[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  try {
    let q = getSupabaseAdmin()
      .from("column")
      .select("*", { count: "exact" })
      .eq("status", PUBLISHED)
      .order("date", { ascending: false });
    if (opts?.category) q = q.contains("column_category", [opts.category]);
    if (opts?.categories?.length === 1) {
      q = q.contains("column_category", opts.categories);
    } else if (opts?.categories && opts.categories.length > 1) {
      q = q.overlaps("column_category", opts.categories);
    }
    if (opts?.tag) q = q.contains("column_tag", [opts.tag]);
    if (opts?.tags?.length === 1) q = q.contains("column_tag", opts.tags);
    else if (opts?.tags && opts.tags.length > 1) {
      q = q.overlaps("column_tag", opts.tags);
    }

    const needsPost =
      (opts?.months && opts.months.length > 0) ||
      (opts?.weekdays && opts.weekdays.length > 0);
    if (opts?.limit && !needsPost) q = q.limit(opts.limit);

    const { data, error, count } = await q;
    if (error) throw error;
    let items = (data ?? []) as Column[];

    if (opts?.months?.length) {
      items = items.filter((c) => dateMatchesMonths(c.date, opts.months!));
    }
    if (opts?.weekdays?.length) {
      items = items.filter((c) => dateMatchesWeekdays(c.date, opts.weekdays!));
    }
    if (opts?.limit && needsPost) {
      items = items.slice(0, opts.limit);
    }

    return {
      items,
      total: needsPost ? items.length : (count ?? items.length),
    };
  } catch (e) {
    console.error("[listColumn]", e);
    return emptyList();
  }
}

export async function listColumnMonths(): Promise<string[]> {
  const { items } = await listColumn();
  const set = new Set<string>();
  for (const c of items) {
    const key = c.date.slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(key)) set.add(key);
  }
  return [...set].sort((a, b) => b.localeCompare(a));
}

export async function listColumnTaxonomy(): Promise<{
  categories: string[];
  tags: string[];
}> {
  const { items } = await listColumn();
  const categories = new Set<string>();
  const tags = new Set<string>();
  for (const c of items) {
    for (const cat of c.column_category ?? []) categories.add(cat);
    for (const tag of c.column_tag ?? []) tags.add(tag);
  }
  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b, "ja")),
    tags: [...tags].sort((a, b) => a.localeCompare(b, "ja")),
  };
}

export async function getColumnBySlug(slug: string): Promise<Column | null> {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("column")
    .select("*")
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .maybeSingle();
  if (error) throw error;
  return data as Column | null;
}

export async function listWork(opts?: {
  category?: string;
  categories?: string[];
  tag?: string;
  tags?: string[];
  clients?: string[];
  years?: string[];
  kinds?: import("@/types/content").WorkKind[];
  /** Exclude these kinds (e.g. Creative excludes involvement) */
  excludeKinds?: import("@/types/content").WorkKind[];
  productKey?: string;
  limit?: number;
}): Promise<{ items: Work[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  try {
    let q = getSupabaseAdmin()
      .from("work")
      .select("*", { count: "exact" })
      .eq("status", PUBLISHED)
      .order("date", { ascending: false });
    if (opts?.category) q = q.contains("work_category", [opts.category]);
    if (opts?.categories?.length === 1) {
      q = q.contains("work_category", opts.categories);
    } else if (opts?.categories && opts.categories.length > 1) {
      q = q.overlaps("work_category", opts.categories);
    }
    if (opts?.tag) q = q.contains("work_tag", [opts.tag]);
    if (opts?.tags?.length === 1) q = q.contains("work_tag", opts.tags);
    else if (opts?.tags && opts.tags.length > 1) {
      q = q.overlaps("work_tag", opts.tags);
    }
    if (opts?.clients?.length === 1) q = q.eq("client", opts.clients[0]);
    else if (opts?.clients && opts.clients.length > 1) {
      q = q.in("client", opts.clients);
    }
    // Prefer client-side kind/product filters until columns are guaranteed
    if (opts?.limit) q = q.limit(opts.limit);

    const { data, error, count } = await q;
    if (error) throw error;
    const { normalizeWorkRow, workYear } = await import(
      "@/lib/content/work-filter"
    );
    let items = ((data ?? []) as Work[]).map((row) =>
      normalizeWorkRow(row as unknown as Record<string, unknown>),
    ) as Work[];

    if (opts?.kinds?.length) {
      items = items.filter((w) => opts.kinds!.includes(w.work_kind));
    }
    if (opts?.excludeKinds?.length) {
      items = items.filter((w) => !opts.excludeKinds!.includes(w.work_kind));
    }
    if (opts?.productKey) {
      items = items.filter((w) => w.product_key === opts.productKey);
    }
    if (opts?.years?.length) {
      items = items.filter((w) => opts.years!.includes(workYear(w)));
    }

    const needsPost =
      Boolean(opts?.years?.length) ||
      Boolean(opts?.excludeKinds?.length) ||
      Boolean(opts?.kinds?.length) ||
      Boolean(opts?.productKey);

    return {
      items,
      total: needsPost ? items.length : (count ?? items.length),
    };
  } catch (e) {
    console.error("[listWork]", e);
    return emptyList();
  }
}

export async function listWorkTaxonomy(): Promise<{
  years: string[];
  categories: string[];
  tags: string[];
  clients: string[];
}> {
  const { items } = await listWork();
  const years = new Set<string>();
  const categories = new Set<string>();
  const tags = new Set<string>();
  const clients = new Set<string>();
  const { workYear } = await import("@/lib/content/work-filter");
  for (const w of items) {
    const y = workYear(w);
    if (y) years.add(y);
    for (const c of w.work_category ?? []) categories.add(c);
    for (const t of w.work_tag ?? []) tags.add(t);
    if (w.client?.trim()) clients.add(w.client.trim());
  }
  return {
    years: [...years].sort((a, b) => b.localeCompare(a)),
    categories: [...categories],
    tags: [...tags].sort((a, b) => a.localeCompare(b, "ja")),
    clients: [...clients].sort((a, b) => a.localeCompare(b, "ja")),
  };
}

export async function getWorkBySlug(slug: string): Promise<Work | null> {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("work")
    .select("*")
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { normalizeWorkRow } = await import("@/lib/content/work-filter");
  return normalizeWorkRow(data as unknown as Record<string, unknown>) as Work;
}

/** Career / involvement periods — separate from Creative (`work`). */
export async function listExperience(): Promise<Experience[]> {
  const { listExperienceMarkdown } = await import(
    "@/lib/content/experience-fs"
  );
  const { normalizeExperienceRow } = await import(
    "@/lib/content/experience-meta"
  );

  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("experience")
        .select("*")
        .eq("status", PUBLISHED)
        .order("start_date", { ascending: false });
      if (error) {
        if (isMissingRelationError(error)) return listExperienceMarkdown();
        throw error;
      }
      const items = (data ?? []).map((row) =>
        normalizeExperienceRow(row as Record<string, unknown>),
      );
      if (items.length) return items;
    } catch (e) {
      logQueryError("[listExperience]", e);
    }
  }
  return listExperienceMarkdown();
}

export async function getExperienceBySlug(
  slug: string,
): Promise<Experience | null> {
  const { readExperienceMarkdown } = await import(
    "@/lib/content/experience-fs"
  );
  const { normalizeExperienceRow } = await import(
    "@/lib/content/experience-meta"
  );

  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("experience")
        .select("*")
        .eq("slug", slug)
        .eq("status", PUBLISHED)
        .maybeSingle();
      if (error) {
        if (!isMissingRelationError(error)) {
          logQueryError("[getExperienceBySlug]", error);
        }
      } else if (data) {
        return normalizeExperienceRow(data as Record<string, unknown>);
      }
    } catch (e) {
      logQueryError("[getExperienceBySlug]", e);
    }
  }
  return readExperienceMarkdown(slug);
}

export async function listGiants(opts?: {
  topic?: string;
  topics?: string[];
  limit?: number;
}): Promise<{ items: ShouldersOfGiants[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  try {
    let q = getSupabaseAdmin()
      .from("shoulders_of_giants")
      .select("*", { count: "exact" })
      .eq("status", PUBLISHED)
      .order("created_at", { ascending: false });
    if (opts?.topic) q = q.contains("topic", [opts.topic]);
    if (opts?.topics?.length === 1) {
      q = q.contains("topic", opts.topics);
    } else if (opts?.topics && opts.topics.length > 1) {
      q = q.overlaps("topic", opts.topics);
    }
    if (opts?.limit) q = q.limit(opts.limit);

    const { data, error, count } = await q;
    if (error) throw error;
    const items = ((data ?? []) as ShouldersOfGiants[]).map((row) => ({
      ...row,
      topic: row.topic ?? [],
      book_title: row.book_title ?? null,
      author: row.author ?? null,
      publisher: row.publisher ?? null,
      published_year: row.published_year ?? null,
      citation_override: row.citation_override ?? null,
      body_html: row.body_html ?? "",
    }));
    return { items, total: count ?? items.length };
  } catch (e) {
    console.error("[listGiants]", e);
    return emptyList();
  }
}

export async function listGiantsTopics(): Promise<string[]> {
  if (!hasSupabaseConfig()) return [];
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("shoulders_of_giants")
      .select("topic")
      .eq("status", PUBLISHED);
    if (error) throw error;
    const set = new Set<string>();
    for (const row of data ?? []) {
      for (const t of (row.topic as string[] | null) ?? []) {
        if (t?.trim()) set.add(t.trim());
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "ja"));
  } catch (e) {
    console.error("[listGiantsTopics]", e);
    return [];
  }
}

export async function getGiantsBySlug(
  slug: string,
): Promise<ShouldersOfGiants | null> {
  if (!hasSupabaseConfig()) return null;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("shoulders_of_giants")
      .select("*")
      .eq("slug", slug)
      .eq("status", PUBLISHED)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as ShouldersOfGiants;
    return {
      ...row,
      topic: row.topic ?? [],
      book_title: row.book_title ?? null,
      author: row.author ?? null,
      publisher: row.publisher ?? null,
      published_year: row.published_year ?? null,
      citation_override: row.citation_override ?? null,
      body_html: row.body_html ?? "",
    };
  } catch (e) {
    console.error("[getGiantsBySlug]", e);
    return null;
  }
}

async function listPhotosFromFs(
  gallery: PhotoGalleryId,
  opts?: {
    years?: string[];
    tags?: string[];
    limit?: number;
  },
): Promise<{ items: Photo[]; total: number }> {
  const { listPhotoMarkdown } = await import("@/lib/content/photo-fs");
  let items = listPhotoMarkdown(gallery);
  if (opts?.tags?.length) {
    items = items.filter((p) =>
      opts.tags!.some((t) => (p.photo_tag ?? []).includes(t)),
    );
  }
  if (opts?.years?.length) {
    const { photoYear } = await import("@/lib/content/photo-filter");
    items = items.filter((p) => opts.years!.includes(photoYear(p.date)));
  }
  const total = items.length;
  if (opts?.limit) items = items.slice(0, opts.limit);
  return { items, total };
}

export async function listPhotos(
  gallery: PhotoGalleryId,
  opts?: {
    years?: string[];
    tags?: string[];
    limit?: number;
  },
): Promise<{ items: Photo[]; total: number }> {
  if (hasSupabaseConfig()) {
    try {
      let q = getSupabaseAdmin()
        .from(gallery)
        .select("*", { count: "exact" })
        .eq("status", PUBLISHED)
        .order("date", { ascending: false });
      if (opts?.tags?.length === 1) q = q.contains("photo_tag", opts.tags);
      else if (opts?.tags && opts.tags.length > 1) {
        q = q.overlaps("photo_tag", opts.tags);
      }
      if (opts?.limit) q = q.limit(opts.limit);

      const { data, error, count } = await q;
      if (error) {
        if (isMissingRelationError(error)) {
          return listPhotosFromFs(gallery, opts);
        }
        throw error;
      }
      let items = ((data ?? []) as Photo[]).map((row) => ({
        ...row,
        photo_tag: row.photo_tag ?? [],
        location: row.location ?? null,
        camera: row.camera ?? null,
        image_url: row.image_url ?? null,
        body_html: row.body_html ?? "",
      }));

      if (opts?.years?.length) {
        const { photoYear } = await import("@/lib/content/photo-filter");
        items = items.filter((p) => opts.years!.includes(photoYear(p.date)));
      }

      if (items.length) {
        return {
          items,
          total: opts?.years?.length ? items.length : (count ?? items.length),
        };
      }
    } catch (e) {
      logQueryError(`[listPhotos:${gallery}]`, e);
    }
  }
  return listPhotosFromFs(gallery, opts);
}

export async function listPhotoTaxonomy(gallery: PhotoGalleryId): Promise<{
  years: string[];
  tags: string[];
}> {
  const { items } = await listPhotos(gallery);
  const years = new Set<string>();
  const tags = new Set<string>();
  const { photoYear } = await import("@/lib/content/photo-filter");
  for (const p of items) {
    const y = photoYear(p.date);
    if (y) years.add(y);
    for (const t of p.photo_tag ?? []) tags.add(t);
  }
  return {
    years: [...years].sort((a, b) => b.localeCompare(a)),
    tags: [...tags].sort((a, b) => a.localeCompare(b, "ja")),
  };
}

export async function getPhotoBySlug(
  gallery: PhotoGalleryId,
  slug: string,
): Promise<Photo | null> {
  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from(gallery)
        .select("*")
        .eq("slug", slug)
        .eq("status", PUBLISHED)
        .maybeSingle();
      if (error) {
        if (!isMissingRelationError(error)) {
          logQueryError(`[getPhotoBySlug:${gallery}]`, error);
        }
      } else if (data) {
        const row = data as Photo;
        return {
          ...row,
          photo_tag: row.photo_tag ?? [],
          location: row.location ?? null,
          camera: row.camera ?? null,
          image_url: row.image_url ?? null,
          body_html: row.body_html ?? "",
        };
      }
    } catch (e) {
      logQueryError(`[getPhotoBySlug:${gallery}]`, e);
    }
  }
  const { readPhotoMarkdown } = await import("@/lib/content/photo-fs");
  return readPhotoMarkdown(gallery, slug);
}

export async function listClip(opts?: {
  tag?: string;
  tags?: string[];
  months?: string[];
  weekdays?: number[];
  limit?: number;
}): Promise<{ items: Clip[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  try {
    let q = getSupabaseAdmin()
      .from("clip")
      .select("*", { count: "exact" })
      .eq("status", PUBLISHED)
      .order("date", { ascending: false });
    if (opts?.tag) q = q.contains("clip_tag", [opts.tag]);
    if (opts?.tags?.length === 1) q = q.contains("clip_tag", opts.tags);
    else if (opts?.tags && opts.tags.length > 1) {
      q = q.overlaps("clip_tag", opts.tags);
    }

    const needsPost =
      (opts?.months && opts.months.length > 0) ||
      (opts?.weekdays && opts.weekdays.length > 0);
    if (opts?.limit && !needsPost) q = q.limit(opts.limit);

    const { data, error, count } = await q;
    if (error) throw error;
    let items = ((data ?? []) as Clip[]).map((row) => ({
      ...row,
      og_image: row.og_image ?? "",
      og_description: row.og_description ?? "",
      memo: row.memo ?? "",
      clip_tag: row.clip_tag ?? [],
    }));

    if (opts?.months?.length) {
      items = items.filter((c) => dateMatchesMonths(c.date, opts.months!));
    }
    if (opts?.weekdays?.length) {
      items = items.filter((c) => dateMatchesWeekdays(c.date, opts.weekdays!));
    }
    if (opts?.limit && needsPost) {
      items = items.slice(0, opts.limit);
    }

    return {
      items,
      total: needsPost ? items.length : (count ?? items.length),
    };
  } catch (e) {
    console.error("[listClip]", e);
    return emptyList();
  }
}

export async function listClipMonths(): Promise<string[]> {
  const { items } = await listClip();
  const set = new Set<string>();
  for (const c of items) {
    const key = c.date.slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(key)) set.add(key);
  }
  return [...set].sort((a, b) => b.localeCompare(a));
}

export async function listClipTags(): Promise<string[]> {
  const { items } = await listClip();
  const set = new Set<string>();
  for (const c of items) {
    for (const t of c.clip_tag ?? []) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ja"));
}

export async function getClipBySlug(slug: string): Promise<Clip | null> {
  if (!hasSupabaseConfig()) return null;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("clip")
      .select("*")
      .eq("slug", slug)
      .eq("status", PUBLISHED)
      .maybeSingle();
    if (error) throw error;
    return data as Clip | null;
  } catch {
    return null;
  }
}

export async function listChronicle(opts?: {
  start?: string;
  end?: string;
  tags?: string[];
  category?: string;
  categories?: string[];
  years?: string[];
  /** Interest lenses: society / tech / personal */
  interests?: import("@/lib/content/chronicle-filter").ChronicleInterestId[];
}): Promise<{ items: Chronicle[]; total: number }> {
  if (!hasSupabaseConfig()) return emptyList();
  try {
    let q = getSupabaseAdmin()
      .from("chronicle")
      .select("*", { count: "exact" })
      .eq("status", PUBLISHED)
      .order("date", { ascending: false });
    if (opts?.start) q = q.gte("date", opts.start);
    if (opts?.end) q = q.lte("date", opts.end);
    if (opts?.category) q = q.eq("category", opts.category);
    if (opts?.categories?.length === 1) {
      q = q.eq("category", opts.categories[0]);
    } else if (opts?.categories && opts.categories.length > 1) {
      q = q.in("category", opts.categories);
    }
    if (opts?.tags?.length === 1) {
      q = q.contains("chronicle_tag", opts.tags);
    } else if (opts?.tags && opts.tags.length > 1) {
      q = q.overlaps("chronicle_tag", opts.tags);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    let items = ((data ?? []) as Chronicle[]).map((row) => ({
      ...row,
      chronicle_tag: row.chronicle_tag ?? [],
      category: row.category ?? null,
      subcategory: row.subcategory ?? null,
      description: row.description ?? null,
      body_html: row.body_html ?? "",
    }));

    if (opts?.years?.length) {
      const { chronicleYear } = await import("@/lib/content/chronicle-filter");
      items = items.filter((c) => opts.years!.includes(chronicleYear(c.date)));
    }
    if (opts?.interests?.length) {
      const { chronicleMatchesAnyInterest } = await import(
        "@/lib/content/chronicle-filter"
      );
      items = items.filter((c) =>
        chronicleMatchesAnyInterest(c, opts.interests!),
      );
    }

    const needsPost =
      Boolean(opts?.years?.length) || Boolean(opts?.interests?.length);

    return {
      items,
      total: needsPost ? items.length : (count ?? items.length),
    };
  } catch (e) {
    console.error("[listChronicle]", e);
    return emptyList();
  }
}

export async function listChronicleTaxonomy(): Promise<{
  years: string[];
  tags: string[];
  categories: string[];
}> {
  const { items } = await listChronicle();
  const years = new Set<string>();
  const tags = new Set<string>();
  const categories = new Set<string>();
  const { chronicleYear } = await import("@/lib/content/chronicle-filter");
  for (const c of items) {
    const y = chronicleYear(c.date);
    if (y) years.add(y);
    for (const t of c.chronicle_tag ?? []) tags.add(t);
    if (c.category?.trim()) categories.add(c.category.trim());
  }
  return {
    years: [...years].sort((a, b) => b.localeCompare(a)),
    tags: [...tags].sort((a, b) => a.localeCompare(b, "ja")),
    categories: [...categories].sort((a, b) => a.localeCompare(b, "ja")),
  };
}

export async function getChronicleBySlug(
  slug: string,
): Promise<Chronicle | null> {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("chronicle")
    .select("*")
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .maybeSingle();
  if (error) throw error;
  return data as Chronicle | null;
}

export async function listAbout(): Promise<About[]> {
  if (!hasSupabaseConfig()) {
    const { listAboutMarkdown } = await import("@/lib/content/about-fs");
    return listAboutMarkdown();
  }
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("about")
      .select("*")
      .eq("status", PUBLISHED)
      .order("slug");
    if (error) throw error;
    const items = (data ?? []) as About[];
    if (items.length) return items;
    const { listAboutMarkdown } = await import("@/lib/content/about-fs");
    return listAboutMarkdown();
  } catch (e) {
    console.error("[listAbout]", e);
    const { listAboutMarkdown } = await import("@/lib/content/about-fs");
    return listAboutMarkdown();
  }
}

export async function getAboutBySlug(slug: string): Promise<About | null> {
  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("about")
        .select("*")
        .eq("slug", slug)
        .eq("status", PUBLISHED)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as About;
    } catch (e) {
      console.error("[getAboutBySlug]", e);
    }
  }
  const { readAboutMarkdown } = await import("@/lib/content/about-fs");
  return readAboutMarkdown(slug);
}

export async function listMediaCoverage(): Promise<MediaCoverage[]> {
  if (hasSupabaseConfig()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("media_coverage")
        .select("*")
        .eq("status", PUBLISHED)
        .order("date", { ascending: false });
      if (error) throw error;
      const items = (data ?? []) as MediaCoverage[];
      if (items.length) return items;
    } catch (e) {
      console.error("[listMediaCoverage]", e);
    }
  }
  const { listMediaCoverageMarkdown } = await import("@/lib/content/about-fs");
  return listMediaCoverageMarkdown();
}

export async function listUidg(opts?: {
  section?: string;
}): Promise<UiDesignGuidebook[]> {
  if (!hasSupabaseConfig()) return [];
  let q = getSupabaseAdmin()
    .from("ui_design_guidebook")
    .select("*")
    .eq("status", PUBLISHED)
    .order("sort_order", { ascending: true });
  if (opts?.section) q = q.eq("section", opts.section);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as UiDesignGuidebook[];
}

export async function getUidgBySlug(
  slug: string,
): Promise<UiDesignGuidebook | null> {
  if (!hasSupabaseConfig()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("ui_design_guidebook")
    .select("*")
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .maybeSingle();
  if (error) throw error;
  return data as UiDesignGuidebook | null;
}

export async function listTopImages(): Promise<TopImage[]> {
  if (!hasSupabaseConfig()) return [];
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("top_image")
      .select("*")
      .eq("status", PUBLISHED)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as TopImage[];
  } catch {
    return [];
  }
}

/** Pick one published top image at random (server-side). */
export async function getRandomTopImage(): Promise<TopImage | null> {
  const items = await listTopImages();
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

/**
 * Local filesystem fallback while Storage/DB seed is pending.
 * Prefer DB rows when present.
 */
export function listLocalTopImageUrls(): string[] {
  const dirs = [
    path.join(process.cwd(), "public/images/top"),
    path.join(process.cwd(), "static/images/top"),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(webp|jpg|jpeg|png|gif)$/i.test(f))
      .map((f) => `/images/top/${f}`);
  }
  return [];
}

export async function getRandomTopImageUrl(): Promise<{
  image_url: string;
  alt: string;
  slug: string;
} | null> {
  try {
    const fromDb = await getRandomTopImage();
    if (fromDb) {
      return {
        image_url: fromDb.image_url,
        alt: fromDb.alt ?? "Random Image",
        slug: fromDb.slug,
      };
    }
  } catch {
    /* table may not exist yet */
  }
  const local = listLocalTopImageUrls();
  if (!local.length) return null;
  const pick = local[Math.floor(Math.random() * local.length)]!;
  return {
    image_url: pick,
    alt: "Random Image",
    slug: pick.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "local",
  };
}

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
