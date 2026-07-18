import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ColumnArticle } from "@/components/ColumnArticle";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import { columnExcerpt, columnThumbSrc } from "@/lib/content/column-meta";
import { absoluteUrl } from "@/lib/content/absolute-url";
import {
  ogImageMetadata,
  resolveOgImageUrl,
  siteUrl,
} from "@/lib/content/og-image";
import { getColumnBySlug, listColumn, listRelatedColumn } from "@/lib/content/queries";
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

  const title = item.title;
  const description = columnExcerpt(item.body_html, 160) || undefined;
  const ogImage = resolveOgImageUrl(
    item.og_image,
    columnThumbSrc(item.body_html, item.og_image, item.slug),
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
  const related = await listRelatedColumn(item).catch(() => []);

  return (
    <SiteShell
      bodyClassName="is-column"
      mobileHeader={<MobileHeader title={item.title} />}
      showTagsAside={false}
      breadcrumbCurrent={item.title}
      showLayoutHeader={false}
      mainClassName="layout-main--single"
    >
      <ColumnArticle item={item} bodyHtml={bodyHtml} />
      {related.length > 0 ? (
        <RelatedPostsSection>
          <ColumnList items={related} hideEmpty />
        </RelatedPostsSection>
      ) : null}
    </SiteShell>
  );
}
