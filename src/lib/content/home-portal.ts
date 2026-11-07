import { columnTagHref } from "@/lib/content/column-filter";
import {
  columnExcerpt,
  columnThumbSrc,
  formatColumnDate,
} from "@/lib/content/column-meta";
import {
  clipListingHref,
  clipSourceLabel,
  clipThumbSrc,
  formatClipDate,
} from "@/lib/content/clip-meta";
import { diaryTagHref } from "@/lib/content/diary-filter";
import {
  diaryExcerpt,
  diaryPermalink,
  diaryThumbSrc,
  formatDiaryDate,
} from "@/lib/content/diary-meta";
import { giantsTagHref } from "@/lib/content/giants-filter";
import {
  formatGiantsCitation,
  giantsPermalink,
  giantsQuoteParagraphs,
} from "@/lib/content/giants-meta";
import { photoDetailHref } from "@/lib/content/photo-adjacent";
import { photoGridSrc } from "@/lib/content/photo-caption";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import { getPhotoGallery } from "@/lib/content/photo-galleries";
import {
  listClip,
  listColumn,
  listDiary,
  listGiants,
  listPhotos,
  listPublicLibrarySections,
  listPublicPhotoGalleries,
  listPublicWritingSections,
} from "@/lib/content/queries";

export type HomeTag = {
  label: string;
  href: string;
};

function homeTags(
  labels: string[] | null | undefined,
  hrefFor: (tag: string) => string,
): HomeTag[] {
  const seen = new Set<string>();
  const tags: HomeTag[] = [];
  for (const raw of labels ?? []) {
    const label = raw.trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    tags.push({ label, href: hrefFor(label) });
  }
  tags.sort((a, b) => a.label.localeCompare(b.label, "ja"));
  return tags;
}

const DIARY_COUNT = 5;
const COLUMN_COUNT = 4;
const PHOTO_COUNT = 6;
const CLIP_COUNT = 5;
const GIANT_COUNT = 4;

export type HomeWritingItem = {
  id: string;
  kind: "diary" | "column";
  href: string;
  headline: string;
  deck: string | null;
  image: string | null;
  tags: HomeTag[];
  dateLabel: string;
  dateTime: string;
};

export type HomePhotoItem = {
  id: string;
  href: string;
  src: string;
  alt: string;
  galleryLabel: string;
  galleryHref: string;
  caption: string | null;
};

export type HomeClipItem = {
  id: string;
  href: string;
  title: string;
  image: string | null;
  tags: HomeTag[];
  source: string;
  dateLabel: string;
  dateTime: string;
};

export type HomeGiantItem = {
  id: string;
  href: string;
  paragraphs: string[];
  citation: string;
  tags: HomeTag[];
};

export type HomePortalData = {
  diaries: HomeWritingItem[];
  columns: HomeWritingItem[];
  diaryHref: string | null;
  columnHref: string | null;
  photos: HomePhotoItem[];
  clips: HomeClipItem[];
  clipsHref: string | null;
  giants: HomeGiantItem[];
  giantsHref: string | null;
};

function publishedStamp(
  publishedAt: string | null | undefined,
  fallback: string | null | undefined,
): { iso: string; time: number } {
  const iso = publishedAt?.trim() || fallback?.trim() || "";
  const time = Date.parse(iso);
  return { iso, time: Number.isNaN(time) ? 0 : time };
}

function formatStamp(iso: string, kind: "diary" | "column" | "clip"): string {
  if (!iso) return "";
  if (kind === "column") return formatColumnDate(iso);
  if (kind === "clip") return formatClipDate(iso);
  return formatDiaryDate(iso);
}

export async function loadHomePortal(): Promise<HomePortalData> {
  const [writingSections, photoGalleries, librarySections] = await Promise.all([
    listPublicWritingSections().catch(() => []),
    listPublicPhotoGalleries().catch(() => []),
    listPublicLibrarySections().catch(() => []),
  ]);

  const diarySection = writingSections.find((section) => section.id === "diary");
  const columnSection = writingSections.find((section) => section.id === "column");
  const clipsSection = librarySections.find((section) => section.id === "clips");
  const giantsSection = librarySections.find((section) => section.id === "giants");

  const [diaryListed, columnListed, photoLists, clips, giants] = await Promise.all([
    diarySection
      ? listDiary({ limit: 24 }).catch(() => ({ items: [], total: 0 }))
      : Promise.resolve({ items: [], total: 0 }),
    columnSection
      ? listColumn({ limit: 24 }).catch(() => ({ items: [], total: 0 }))
      : Promise.resolve({ items: [], total: 0 }),
    Promise.all(
      photoGalleries.map(async (gallery) => {
        const listed = await listPhotos(gallery.id).catch(() => ({
          items: [],
          total: 0,
        }));
        return { galleryId: gallery.id, items: listed.items };
      }),
    ),
    clipsSection
      ? listClip({ limit: 24 }).catch(() => ({ items: [], total: 0 }))
      : Promise.resolve({ items: [], total: 0 }),
    giantsSection
      ? listGiants({ limit: 24 }).catch(() => ({ items: [], total: 0 }))
      : Promise.resolve({ items: [], total: 0 }),
  ]);

  const writing: Array<HomeWritingItem & { time: number }> = [];

  for (const item of diaryListed.items) {
    const stamp = publishedStamp(item.published_at, item.date);
    const headline = diaryExcerpt(item.body_html, 180);
    if (!headline) continue;
    writing.push({
      id: `diary-${item.id}`,
      kind: "diary",
      href: diaryPermalink(item.slug),
      headline,
      deck: null,
      image: diaryThumbSrc(
        item.body_html,
        item.og_image,
        diarySection?.og_image,
      ),
      tags: homeTags(item.diary_tag, diaryTagHref),
      dateLabel: formatStamp(stamp.iso, "diary"),
      dateTime: stamp.iso,
      time: stamp.time,
    });
  }

  for (const item of columnListed.items) {
    const stamp = publishedStamp(item.published_at, item.date);
    const title = item.title.trim();
    const deck = columnExcerpt(item.body_html, 160);
    const headline = title || deck;
    if (!headline) continue;
    writing.push({
      id: `column-${item.id}`,
      kind: "column",
      href: `/column/${item.slug}/`,
      headline,
      deck: title && deck && deck !== title ? deck : null,
      image: columnThumbSrc(item.body_html, item.og_image, item.slug),
      tags: homeTags(item.column_tag, columnTagHref),
      dateLabel: formatStamp(stamp.iso, "column"),
      dateTime: stamp.iso,
      time: stamp.time,
    });
  }

  const diaries = writing
    .filter((item) => item.kind === "diary")
    .sort((a, b) => b.time - a.time);
  const columns = writing
    .filter((item) => item.kind === "column")
    .sort((a, b) => b.time - a.time);

  const photos: Array<HomePhotoItem & { time: number }> = [];
  for (const group of photoLists) {
    const gallery = getPhotoGallery(group.galleryId as PhotoGalleryId);
    for (const photo of group.items) {
      const src = photoGridSrc(photo);
      if (!src) continue;
      const stamp = publishedStamp(photo.date, "");
      const location = photo.location?.trim() || "";
      const title = photo.title.trim();
      photos.push({
        id: `${group.galleryId}-${photo.id}`,
        href: photoDetailHref(gallery.basePath, photo.slug),
        src,
        alt: title || location || gallery.label,
        galleryLabel: gallery.label,
        galleryHref: gallery.basePath,
        caption: location || title || null,
        time: stamp.time,
      });
    }
  }
  photos.sort((a, b) => b.time - a.time);

  const clipItems: Array<HomeClipItem & { time: number }> = clips.items
    .filter((item) => item.title.trim() && item.source_url.trim())
    .map((item) => {
      const stamp = publishedStamp(item.published_at, item.date);
      return {
        id: item.id,
        href: item.source_url,
        title: item.title.trim(),
        image: clipThumbSrc(item),
        tags: homeTags(item.clip_tag, (tag) => clipListingHref({ tag })),
        source: clipSourceLabel(item.source_url, item.source_name),
        dateLabel: formatStamp(stamp.iso, "clip"),
        dateTime: stamp.iso,
        time: stamp.time,
      };
    });
  clipItems.sort((a, b) => b.time - a.time);

  const giantItems: Array<HomeGiantItem & { time: number }> = [];
  for (const item of giants.items) {
    const paragraphs = giantsQuoteParagraphs(item.body_html);
    if (!paragraphs.length) continue;
    const stamp = publishedStamp(item.published_at, item.created_at);
    giantItems.push({
      id: item.id,
      href: giantsPermalink(item.slug),
      paragraphs,
      citation: formatGiantsCitation(item),
      tags: homeTags(item.giants_tag, giantsTagHref),
      time: stamp.time,
    });
  }
  giantItems.sort((a, b) => b.time - a.time);

  return {
    diaries: diaries.slice(0, DIARY_COUNT).map(({ time: _time, ...item }) => item),
    columns: columns.slice(0, COLUMN_COUNT).map(({ time: _time, ...item }) => item),
    diaryHref: diarySection?.basePath ?? null,
    columnHref: columnSection?.basePath ?? null,
    photos: photos.slice(0, PHOTO_COUNT).map(({ time: _time, ...item }) => item),
    clips: clipItems.slice(0, CLIP_COUNT).map(({ time: _time, ...item }) => item),
    clipsHref: clipsSection?.basePath ?? null,
    giants: giantItems.slice(0, GIANT_COUNT).map(({ time: _time, ...item }) => item),
    giantsHref: giantsSection?.basePath ?? null,
  };
}
