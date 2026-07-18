import fs from "node:fs";
import path from "node:path";
import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import type { TopImage } from "@/types/content";

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
