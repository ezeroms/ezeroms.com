import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { DiaryTimeline } from "@/components/DiaryTimeline";
import { MobileHeader } from "@/components/MobileHeader";
import {
  absoluteUrl,
  diaryExcerpt,
  diaryMonthKey,
  diaryPermalink,
  diaryTitle,
  firstImageSrc,
} from "@/lib/content/diary-meta";
import {
  getDiaryBySlug,
  listDiary,
  listDiaryMonths,
  listDiaryTaxonomy,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";
import { NotesFilterPanel } from "@/components/NotesFilterPanel";
import { emptyNotesFilter } from "@/lib/content/notes-filter";

export const revalidate = 60;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://ezeroms.com";

export async function generateStaticParams() {
  const { items } = await listDiary().catch(() => ({ items: [] as Awaited<
    ReturnType<typeof listDiary>
  >["items"] }));
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getDiaryBySlug(slug);
  if (!item) return { title: "Notes" };

  const title = diaryTitle(item);
  const description = diaryExcerpt(item.body_html, 160) || undefined;
  const img = firstImageSrc(item.body_html);
  const ogImage = img
    ? absoluteUrl(img, SITE_URL)
    : absoluteUrl("/images/common/og-image.png", SITE_URL);
  const url = absoluteUrl(diaryPermalink(slug), SITE_URL);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: item.published_at ?? item.date,
      modifiedTime: item.updated_at,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function DiaryEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getDiaryBySlug(slug);
  if (!item) notFound();

  const month = diaryMonthKey(item);
  const [months, taxonomy, monthResult] = await Promise.all([
    listDiaryMonths(),
    listDiaryTaxonomy().catch(() => ({ tags: [], places: [] })),
    month ? listDiary({ month }) : Promise.resolve({ items: [item] }),
  ]);
  const { items } = monthResult;

  // Ensure focused entry is present even if month taxonomy is missing
  const bySlug = new Map(items.map((i) => [i.slug, i]));
  if (!bySlug.has(item.slug)) bySlug.set(item.slug, item);
  const ordered = [...bySlug.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const sanitized = ordered.map((row) => ({
    ...row,
    body_html: sanitizeBody(row.body_html),
  }));

  return (
    <SiteShell
      bodyClassName="is-diary"
      mobileHeader={<MobileHeader title={month || "Notes"} />}
      secondary={
        <NotesFilterPanel
          months={months}
          tags={taxonomy.tags}
          places={taxonomy.places}
          initial={emptyNotesFilter()}
        />
      }
      showTagsAside
    >
      <DiaryTimeline items={sanitized} focusSlug={slug} />
    </SiteShell>
  );
}
