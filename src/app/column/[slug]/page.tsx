import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleNavigation } from "@/components/ArticleNavigation";
import { ColumnArticle } from "@/components/ColumnArticle";
import { SiteShell } from "@/components/SiteShell";
import { columnExcerpt, columnThumbSrc } from "@/lib/content/column-meta";
import { absoluteUrl } from "@/lib/content/absolute-url";
import {
  ogImageMetadata,
  resolveOgImageUrl,
  siteUrl,
} from "@/lib/content/og-image";
import {
  getAdjacentColumn,
  getColumnBySlug,
  listColumn,
  listRelatedColumn,
  loadWritingSection,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";
import { ColumnList } from "@/components/ColumnList";
import { RelatedPostsSection } from "@/components/RelatedPostsSection";

export const revalidate = 60;

export async function generateStaticParams() {
  const { items } = await listColumn().catch(() => ({
    items: [] as Awaited<ReturnType<typeof listColumn>>["items"],
  }));
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getColumnBySlug(slug);
  if (!item) return { title: "Column" };

  const section = await loadWritingSection("column");
  const title = item.title;
  const description = columnExcerpt(item.body_html, 160) || undefined;
  const ogImage = resolveOgImageUrl(
    item.og_image,
    section.og_image,
    columnThumbSrc(item.body_html, item.og_image, item.slug, section.og_image),
  );
  const url = absoluteUrl(`/column/${slug}/`, siteUrl());
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

export default async function ColumnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getColumnBySlug(slug);
  if (!item) notFound();

  const bodyHtml = sanitizeBody(item.body_html);
  const [related, adjacent, section] = await Promise.all([
    listRelatedColumn(item).catch(() => []),
    getAdjacentColumn(slug).catch(() => ({ previous: null, next: null })),
    loadWritingSection("column"),
  ]);

  return (
    <SiteShell
      bodyClassName="is-column"
      showTagsAside={false}
      breadcrumbCurrent={item.title}
      showLayoutHeader={false}
      mainClassName="layout-main--single"
    >
      <ColumnArticle item={item} bodyHtml={bodyHtml} />
      <ArticleNavigation
        previous={
          adjacent.previous
            ? {
                href: `/column/${adjacent.previous.slug}/`,
                title: adjacent.previous.title,
              }
            : null
        }
        next={
          adjacent.next
            ? {
                href: `/column/${adjacent.next.slug}/`,
                title: adjacent.next.title,
              }
            : null
        }
      />
      {related.length > 0 ? (
        <RelatedPostsSection>
          <ColumnList
            items={related}
            hideEmpty
            fallbackThumbSrc={section.og_image || null}
          />
        </RelatedPostsSection>
      ) : null}
    </SiteShell>
  );
}
