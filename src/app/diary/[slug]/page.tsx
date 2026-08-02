import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoteArticle } from "@/components/NoteArticle";
import { SiteShell } from "@/components/SiteShell";
import { absoluteUrl } from "@/lib/content/absolute-url";
import { firstImageSrc } from "@/lib/content/html-plain";
import {
  notesExcerpt,
  notesPermalink,
  notesTitle,
  formatNotesDate,
} from "@/lib/content/notes-meta";
import {
  ogImageMetadata,
  resolveOgImageUrl,
  siteUrl,
} from "@/lib/content/og-image";
import {
  getDiaryBySlug,
  listDiary,
  listRelatedDiary,
  loadWritingSection,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";
import { NotesTimeline } from "@/components/NotesTimeline";
import { RelatedPostsSection } from "@/components/RelatedPostsSection";

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
  if (!item) return { title: "Notes" };

  const section = await loadWritingSection("notes");
  const title = notesTitle(item);
  const description = notesExcerpt(item.body_html, 160) || undefined;
  const ogImage = resolveOgImageUrl(
    item.og_image,
    section.og_image,
    firstImageSrc(item.body_html),
  );
  const url = absoluteUrl(notesPermalink(slug), siteUrl());
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
  const breadcrumbLabel = formatNotesDate(item.date) || "Note";
  const related = await listRelatedDiary(item).catch(() => []);

  return (
    <SiteShell
      bodyClassName="is-diary"
      breadcrumbCurrent={breadcrumbLabel}
      showTagsAside={false}
      mainClassName="layout-main--single"
    >
      <NoteArticle item={item} bodyHtml={bodyHtml} />
      {related.length > 0 ? (
        <RelatedPostsSection>
          <NotesTimeline
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
