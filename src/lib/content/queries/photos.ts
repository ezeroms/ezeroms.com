import {
  emptyList,
  getSupabaseAdmin,
  hasSupabaseConfig,
  isMissingRelationError,
  logQueryError,
  PUBLISHED,
} from "@/lib/content/queries/_shared";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { photoYear } from "@/lib/content/photo-filter";
import type { Photo } from "@/types/content";

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
