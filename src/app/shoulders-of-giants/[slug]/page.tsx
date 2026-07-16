import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiantsFilterPanel } from "@/components/GiantsFilterPanel";
import { GiantsTimeline } from "@/components/GiantsTimeline";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import { emptyGiantsFilter } from "@/lib/content/giants-filter";
import {
  formatGiantsCitation,
  giantsExcerpt,
  giantsPermalink,
} from "@/lib/content/giants-meta";
import {
  getGiantsBySlug,
  listGiants,
  listGiantsTopics,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://ezeroms.com";

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
  const { slug } = await params;
  const item = await getGiantsBySlug(slug);
  if (!item) return { title: "The shoulders of Giants" };

  const citation = formatGiantsCitation(item);
  const title = citation || item.book_title || "The shoulders of Giants";
  const description = giantsExcerpt(item.body_html, 160) || undefined;
  const url = `${SITE_URL}${giantsPermalink(slug)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
  };
}

export default async function GiantsEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getGiantsBySlug(slug);
  if (!item) notFound();

  const topics = item.topic ?? [];
  const [allTopics, related] = await Promise.all([
    listGiantsTopics().catch(() => [] as string[]),
    topics.length
      ? listGiants({ topics, limit: 40 }).catch(() => ({
          items: [item],
          total: 1,
        }))
      : listGiants({ limit: 40 }).catch(() => ({ items: [item], total: 1 })),
  ]);

  const bySlug = new Map(related.items.map((i) => [i.slug, i]));
  if (!bySlug.has(item.slug)) bySlug.set(item.slug, item);
  const ordered = [...bySlug.values()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );

  const sanitized = ordered.map((row) => ({
    ...row,
    body_html: sanitizeBody(row.body_html),
  }));

  return (
    <SiteShell
      bodyClassName="is-shoulders-of-giants"
      mobileHeader={
        <MobileHeader title={formatGiantsCitation(item) || "Giants"} />
      }
      secondary={
        <GiantsFilterPanel topics={allTopics} initial={emptyGiantsFilter()} />
      }
      showTagsAside
      hidePageHeader
    >
      <GiantsTimeline items={sanitized} focusSlug={slug} />
    </SiteShell>
  );
}
