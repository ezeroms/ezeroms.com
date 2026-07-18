import {
  getSupabaseAdmin,
  hasSupabaseConfig,
  isMissingRelationError,
  logQueryError,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { resolvePhotoDbTable } from "@/lib/content/photo-db";
import { photoYear } from "@/lib/content/photo-filter";
import type { Photo } from "@/types/content";

function normalizePhotoRow(row: Photo): Photo {
  return {
    ...row,
    photo_tag: row.photo_tag ?? [],
    location: row.location ?? null,
    camera: row.camera ?? null,
    image_url: row.image_url ?? null,
    image_thumb_url: row.image_thumb_url ?? null,
    body_html: row.body_html ?? "",
  };
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
    items = items.filter((photo) =>
      opts.tags!.some((tag) => (photo.photo_tag ?? []).includes(tag)),
    );
  }

  if (opts?.years?.length) {
    items = items.filter((photo) =>
      opts.years!.includes(photoYear(photo.date)),
    );
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
      const { table } = await resolvePhotoDbTable(gallery);
      let query = getSupabaseAdmin()
        .from(table)
        .select("*", { count: "exact" })
        .eq("status", PUBLISHED)
        .eq("is_deleted", false)
        .order("date", { ascending: false });

      // snap には photo_tag が無いため、タグ絞り込みは新テーブルのみ
      if (table !== "snap") {
        if (opts?.tags?.length === 1) {
          query = query.contains("photo_tag", opts.tags);
        } else if (opts?.tags && opts.tags.length > 1) {
          query = query.overlaps("photo_tag", opts.tags);
        }
      }

      if (opts?.limit) query = query.limit(opts.limit);

      const { data, error, count } = await query;
      if (error) {
        if (isMissingRelationError(error)) {
          return listPhotosFromFs(gallery, opts);
        }
        throw error;
      }

      let items = ((data ?? []) as Photo[]).map(normalizePhotoRow);

      if (opts?.years?.length) {
        items = items.filter((photo) =>
          opts.years!.includes(photoYear(photo.date)),
        );
      }

      if (items.length) {
        return {
          items,
          total: opts?.years?.length ? items.length : (count ?? items.length),
        };
      }
    } catch (error) {
      logQueryError(`[listPhotos:${gallery}]`, error);
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

  for (const photo of items) {
    const year = photoYear(photo.date);
    if (year) years.add(year);
    for (const tag of photo.photo_tag ?? []) tags.add(tag);
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
      const { table } = await resolvePhotoDbTable(gallery);
      const { data, error } = await getSupabaseAdmin()
        .from(table)
        .select("*")
        .eq("slug", slug)
        .eq("status", PUBLISHED)
        .eq("is_deleted", false)
        .maybeSingle();

      if (error) {
        if (!isMissingRelationError(error)) {
          logQueryError(`[getPhotoBySlug:${gallery}]`, error);
        }
      } else if (data) {
        return normalizePhotoRow(data as Photo);
      }
    } catch (error) {
      logQueryError(`[getPhotoBySlug:${gallery}]`, error);
    }
  }

  const { readPhotoMarkdown } = await import("@/lib/content/photo-fs");
  return readPhotoMarkdown(gallery, slug);
}
