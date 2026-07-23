import fs from "node:fs";
import path from "node:path";
import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import type { TopImage } from "@/types/content";

/** Parse "Sado, 2013" style captions from alt when columns are empty. */
export function parseTopImageCaption(raw: string | null | undefined): {
  location: string | null;
  captured_year: number | null;
} {
  const text = (raw ?? "").trim();
  const match = text.match(/^(.+?),\s*(\d{4})$/);
  if (!match) return { location: null, captured_year: null };
  const location = match[1]?.trim() || null;
  const year = Number(match[2]);
  return {
    location,
    captured_year: Number.isInteger(year) ? year : null,
  };
}

function mapTopImage(row: Record<string, unknown>): TopImage {
  const yearRaw = row.captured_year;
  let captured_year =
    typeof yearRaw === "number"
      ? yearRaw
      : yearRaw != null && String(yearRaw).trim() !== ""
        ? Number(yearRaw)
        : null;
  let location = (row.location as string | null) ?? null;

  if (!location && (captured_year == null || !Number.isFinite(captured_year))) {
    const fromAlt = parseTopImageCaption((row.alt as string | null) ?? "");
    location = fromAlt.location;
    captured_year = fromAlt.captured_year;
  }

  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    image_url: String(row.image_url ?? ""),
    alt: (row.alt as string | null) ?? null,
    location,
    captured_year:
      captured_year != null && Number.isFinite(captured_year)
        ? captured_year
        : null,
    sort_order: Number(row.sort_order ?? 0) || 0,
    status: (row.status as TopImage["status"]) ?? "published",
    published_at: (row.published_at as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    is_deleted: row.is_deleted === true,
  };
}

export async function listTopImages(): Promise<TopImage[]> {
  if (!hasSupabaseConfig()) return [];
  try {
    let { data, error } = await getSupabaseAdmin()
      .from("top_image")
      .select("*")
      .eq("status", PUBLISHED)
      .eq("is_deleted", false)
      .order("sort_order", { ascending: true });

    if (error) {
      const fallback = await getSupabaseAdmin()
        .from("top_image")
        .select("*")
        .eq("status", PUBLISHED)
        .order("sort_order", { ascending: true });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[])
      .filter((row) => row.is_deleted !== true)
      .map(mapTopImage);
  } catch {
    return [];
  }
}

export async function getRandomTopImage(): Promise<TopImage | null> {
  const items = await listTopImages();
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

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

export type RandomTopImagePayload = {
  image_url: string;
  alt: string;
  slug: string;
  location: string | null;
  captured_year: number | null;
};

export async function getRandomTopImageUrl(): Promise<RandomTopImagePayload | null> {
  try {
    const fromDb = await getRandomTopImage();
    if (fromDb) {
      return {
        image_url: fromDb.image_url,
        alt: fromDb.alt ?? "Random Image",
        slug: fromDb.slug,
        location: fromDb.location,
        captured_year: fromDb.captured_year,
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
    location: null,
    captured_year: null,
  };
}
