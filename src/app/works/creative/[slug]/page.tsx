import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleNavigation } from "@/components/ArticleNavigation";
import { RelatedPostsSection } from "@/components/RelatedPostsSection";
import { SiteShell } from "@/components/SiteShell";
import { WorkArticle } from "@/components/WorkArticle";
import { WorkList } from "@/components/WorkList";
import { absoluteUrl } from "@/lib/content/absolute-url";
import {
  ogImageMetadata,
  resolveOgImageUrl,
  siteUrl,
} from "@/lib/content/og-image";
import {
  getAdjacentWork,
  getWorkBySlug,
  listRelatedWork,
  listWork,
  listWorkTaxonomy,
  requirePublicWorksSection,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";
import {
  ReadingTopicsAside,
  workTagHref,
} from "@/components/ReadingTopicsAside";

export const revalidate = 60;

export async function generateStaticParams() {
  const { items } = await listWork({
    excludeKinds: ["involvement"],
  }).catch(() => ({
    items: [] as Awaited<ReturnType<typeof listWork>>["items"],
  }));
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const section = await requirePublicWorksSection("creative").catch(() => null);
  if (!section) return { title: "Creative" };

  const { slug } = await params;
  const item = await getWorkBySlug(slug);
  if (!item) return { title: section.label };

  const title = item.title;
  const url = absoluteUrl(`/works/creative/${slug}/`, siteUrl());
  const ogImage = resolveOgImageUrl(
    item.og_image,
    section.og_image,
    item.image_url,
  );
  const images = ogImageMetadata(ogImage);

  return {
    title,
    alternates: { canonical: url },
    openGraph: {
      ...images.openGraph,
      title,
      url,
      type: "article",
    },
    twitter: {
      ...images.twitter,
      title,
    },
  };
}

export default async function CreativeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requirePublicWorksSection("creative");
  const { slug } = await params;
  const item = await getWorkBySlug(slug);
  if (!item) notFound();

  const bodyHtml = sanitizeBody(item.body_html ?? "");
  const [related, adjacent, section, taxonomy] = await Promise.all([
    listRelatedWork(item).catch(() => []),
    getAdjacentWork(slug).catch(() => ({ previous: null, next: null })),
    requirePublicWorksSection("creative"),
    listWorkTaxonomy().catch(() => ({
      years: [] as string[],
      categories: [] as string[],
      tags: [] as string[],
      clients: [] as string[],
    })),
  ]);

  return (
    <SiteShell
      bodyClassName="is-works-creative"
      showTagsAside={false}
      breadcrumbCurrent={item.title}
      showLayoutHeader={false}
      mainClassName="layout-main--single"
      aside={
        taxonomy.tags.length ? (
          <ReadingTopicsAside
            tags={taxonomy.tags}
            hrefFor={workTagHref}
            allHref="/works/creative/"
            selected={item.work_tag}
          />
        ) : undefined
      }
    >
      <WorkArticle item={item} bodyHtml={bodyHtml} />
      <ArticleNavigation
        chrome="plain"
        previous={
          adjacent.previous
            ? {
                href: `/works/creative/${adjacent.previous.slug}/`,
                title: adjacent.previous.title,
              }
            : null
        }
        next={
          adjacent.next
            ? {
                href: `/works/creative/${adjacent.next.slug}/`,
                title: adjacent.next.title,
              }
            : null
        }
      />
      {related.length > 0 ? (
        <RelatedPostsSection className="max-w-2xl">
          <WorkList
            items={related}
            hideEmpty
            fallbackThumbSrc={section.og_image || null}
          />
        </RelatedPostsSection>
      ) : null}
    </SiteShell>
  );
}
