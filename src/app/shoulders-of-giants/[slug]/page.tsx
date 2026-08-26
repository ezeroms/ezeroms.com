import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiantsArticle } from "@/components/GiantsArticle";
import {
  ReadingTopicsAside,
} from "@/components/ReadingTopicsAside";
import { SiteShell } from "@/components/SiteShell";
import {
  formatGiantsCitation,
  giantsExcerpt,
  giantsPermalink,
} from "@/lib/content/giants-meta";
import { giantsTagHref } from "@/lib/content/giants-filter";
import {
  ogImageMetadata,
  resolveOgImageUrl,
  siteUrl,
} from "@/lib/content/og-image";
import {
  getGiantsBySlug,
  listGiants,
  listGiantsTags,
  listRelatedGiants,
  requirePublicLibrarySection,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

export async function generateStaticParams() {
  const { items } = await listGiants().catch(() => ({
    items: [] as Awaited<ReturnType<typeof listGiants>>["items"],
  }));
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const section = await requirePublicLibrarySection("giants").catch(() => null);
  if (!section) return { title: "The shoulders of Giants" };

  const { slug } = await params;
  const item = await getGiantsBySlug(slug);
  if (!item) return { title: section.label };
  const citation = formatGiantsCitation(item);
  const title = citation || item.book_title || "The shoulders of Giants";
  const description = giantsExcerpt(item.body_html, 160) || undefined;
  const url = `${siteUrl()}${giantsPermalink(slug)}`;
  const ogImage = resolveOgImageUrl(item.og_image, section.og_image);
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
    },
    twitter: {
      ...images.twitter,
      title,
      description,
    },
  };
}

export default async function GiantsEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requirePublicLibrarySection("giants");
  const { slug } = await params;
  const item = await getGiantsBySlug(slug);
  if (!item) notFound();
  const citation = formatGiantsCitation(item);
  const bodyHtml = sanitizeBody(item.body_html);

  const [tags, related] = await Promise.all([
    listGiantsTags().catch(() => [] as string[]),
    listRelatedGiants(item).catch(() => []),
  ]);

  const relatedSanitized = related.map((entry) => ({
    ...entry,
    body_html: sanitizeBody(entry.body_html),
  }));

  return (
    <SiteShell
      bodyClassName="is-shoulders-of-giants"
      showTagsAside={false}
      showTagsRail
      tagsRailDefaultOpen
      breadcrumbCurrent={citation || item.book_title || slug}
      mainClassName="layout-main--single"
      aside={
        tags.length ? (
          <ReadingTopicsAside
            tags={tags}
            hrefFor={giantsTagHref}
            allHref="/shoulders-of-giants/"
            selected={item.giants_tag}
          />
        ) : undefined
      }
    >
      <GiantsArticle
        item={item}
        bodyHtml={bodyHtml}
        related={relatedSanitized}
        tags={tags}
      />
    </SiteShell>
  );
}
