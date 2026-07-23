import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiantsArticle } from "@/components/GiantsArticle";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import {
  formatGiantsCitation,
  giantsExcerpt,
  giantsPermalink,
} from "@/lib/content/giants-meta";
import {
  ogImageMetadata,
  resolveOgImageUrl,
  siteUrl,
} from "@/lib/content/og-image";
import {
  getGiantsBySlug,
  listGiants,
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
  const ogImage = resolveOgImageUrl(item.og_image);
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

  return (
    <SiteShell
      bodyClassName="is-shoulders-of-giants"
      mobileHeader={
        <MobileHeader title={citation || "The shoulders of Giants"} />
      }
      showTagsAside={false}
      breadcrumbCurrent={citation || item.book_title || slug}
      mainClassName="layout-main--single"
    >
      <GiantsArticle item={item} bodyHtml={bodyHtml} />
    </SiteShell>
  );
}
