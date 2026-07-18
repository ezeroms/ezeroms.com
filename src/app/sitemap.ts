import type { MetadataRoute } from "next";
import { notesPermalink } from "@/lib/content/notes-meta";
import { giantsPermalink } from "@/lib/content/giants-meta";
import {
  listDiary,
  listDiaryMonths,
  listGiants,
} from "@/lib/content/queries";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://ezeroms.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/diary/`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/clips/`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/about/me/`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about/here/`, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${SITE_URL}/about/media-coverage/`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    { url: `${SITE_URL}/about/contact/`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/column/`, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${SITE_URL}/works/creative/`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/works/experience/`,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/works/chooning/`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/shoulders-of-giants/`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  try {
    const [{ items }, months, giants] = await Promise.all([
      listDiary(),
      listDiaryMonths(),
      listGiants(),
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
