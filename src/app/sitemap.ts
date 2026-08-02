import type { MetadataRoute } from "next";
import { notesPermalink } from "@/lib/content/notes-meta";
import { giantsPermalink } from "@/lib/content/giants-meta";
import {
  listDiary,
  listDiaryMonths,
  listGiants,
  listPublicLibrarySections,
  listPublicWorksSections,
  loadLibrarySection,
} from "@/lib/content/queries";
import { isLibrarySectionPublic } from "@/lib/content/library-sections";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://ezeroms.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [publicWorks, publicLibrary] = await Promise.all([
    listPublicWorksSections().catch(() => []),
    listPublicLibrarySections().catch(() => []),
  ]);

  const worksEntries: MetadataRoute.Sitemap = publicWorks.map((section) => ({
    url: `${SITE_URL}${section.basePath}`,
    changeFrequency: "monthly" as const,
    priority:
      section.id === "creative" ? 0.8 : section.id === "experience" ? 0.75 : 0.7,
  }));

  const libraryEntries: MetadataRoute.Sitemap = publicLibrary.map((section) => ({
    url: `${SITE_URL}${section.basePath}`,
    changeFrequency: "weekly" as const,
    priority:
      section.id === "clips"
        ? 0.85
        : section.id === "giants"
          ? 0.7
          : section.id === "chronicle"
            ? 0.65
            : 0.5,
  }));

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/diary/`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about/me/`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about/here/`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/about/contact/`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/column/`, changeFrequency: "weekly", priority: 0.8 },
    ...worksEntries,
    ...libraryEntries,
  ];

  try {
    const giantsPublic = isLibrarySectionPublic(
      await loadLibrarySection("giants"),
    );
    const [{ items }, months, giants] = await Promise.all([
      listDiary(),
      listDiaryMonths(),
      giantsPublic
        ? listGiants()
        : Promise.resolve({ items: [], total: 0 }),
    ]);

    for (const month of months) {
      entries.push({
        url: `${SITE_URL}/diary_month/${month}/`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    for (const item of items) {
      entries.push({
        url: `${SITE_URL}${notesPermalink(item.slug)}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : undefined,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    for (const item of giants.items) {
      entries.push({
        url: `${SITE_URL}${giantsPermalink(item.slug)}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : undefined,
        changeFrequency: "monthly",
        priority: 0.55,
      });
    }
  } catch {
    /* Supabase unavailable at build — keep static URLs only */
  }

  return entries;
}
