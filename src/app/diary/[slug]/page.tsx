import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiaryArticle } from "@/components/DiaryArticle";
import { SiteShell } from "@/components/SiteShell";
import { absoluteUrl } from "@/lib/content/absolute-url";
import { firstImageSrc } from "@/lib/content/html-plain";
import {
  diaryExcerpt,
  diaryPermalink,
  diaryTitle,
  formatDiaryDate,
} from "@/lib/content/diary-meta";
import {
  ogImageMetadata,
  resolveOgImageUrl,
  siteUrl,
} from "@/lib/content/og-image";
import {
  getDiaryBySlug,
  listDiary,
  listDiaryTaxonomy,
  listRelatedDiary,
  loadWritingSection,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";
import { DiaryTimeline } from "@/components/DiaryTimeline";
import { RelatedPostsSection } from "@/components/RelatedPostsSection";
import {
  ReadingTopicsAside,
  diaryTagHref,
} from "@/components/ReadingTopicsAside";

export const revalidate = 60;

export async function generateStaticParams() {
  const { items } = await listDiary().catch(() => ({
    items: [] as Awaited<ReturnType<typeof listDiary>>["items"],
  }));
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getDiaryBySlug(slug);
  if (!item) return { title: "Diary" };

  const section = await loadWritingSection("diary");
  const title = diaryTitle(item);
  const description = diaryExcerpt(item.body_html, 160) || undefined;
  const ogImage = resolveOgImageUrl(
    item.og_image,
    section.og_image,
    firstImageSrc(item.body_html),
  );
  const url = absoluteUrl(diaryPermalink(slug), siteUrl());
  const images = ogImageMetadata(ogImage);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      ...images.openGraph,
      title,
      description,
      url,
      type: "article",
      publishedTime: item.published_at ?? item.date,
      modifiedTime: item.updated_at,
    },
    twitter: {
      ...images.twitter,
      title,
      description,
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

  const bodyHtml = sanitizeBody(item.body_html);
  const breadcrumbLabel = formatDiaryDate(item.date) || "Diary";
  const [related, taxonomy] = await Promise.all([
    listRelatedDiary(item).catch(() => []),
    listDiaryTaxonomy().catch(() => ({ tags: [] as string[], places: [] })),
  ]);

  return (
    <SiteShell
      bodyClassName="is-diary"
      breadcrumbCurrent={breadcrumbLabel}
      showTagsAside={false}
      mainClassName="layout-main--single"
      aside={
        taxonomy.tags.length ? (
          <ReadingTopicsAside
            tags={taxonomy.tags}
            hrefFor={diaryTagHref}
            allHref="/diary/"
            selected={item.diary_tag}
          />
        ) : undefined
      }
    >
      <DiaryArticle item={item} bodyHtml={bodyHtml} />
      {related.length > 0 ? (
        <RelatedPostsSection className="max-w-2xl">
          <DiaryTimeline
            items={related.map((entry) => ({
              ...entry,
              body_html: sanitizeBody(entry.body_html),
            }))}
            hideEmpty
            showNotification={false}
          />
        </RelatedPostsSection>
      ) : null}
    </SiteShell>
  );
}
