import type { Metadata } from "next";
import { GiantsBrowse } from "@/components/GiantsBrowse";
import {
  ReadingTopicsAside,
} from "@/components/ReadingTopicsAside";
import { SiteShell } from "@/components/SiteShell";
import {
  giantsFilterActive,
  giantsTagHref,
  parseGiantsFilter,
} from "@/lib/content/giants-filter";
import { sectionListingMetadata } from "@/lib/content/section-listing-metadata";
import { summarizeGiantsFilter } from "@/lib/site/breadcrumb-filters";
import {
  listGiants,
  listGiantsTags,
  requirePublicLibrarySection,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";
import type { ShouldersOfGiants } from "@/types/content";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const section = await requirePublicLibrarySection("giants").catch(() => null);
  return sectionListingMetadata({
    title: section?.label ?? "The shoulders of Giants",
    description: "影響を受けた人・作品・考え方のメモ。",
    ogImage: section?.og_image,
  });
}

function shuffleItems<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export default async function GiantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const section = await requirePublicLibrarySection("giants");
  const resolvedSearchParams = await searchParams;
  const filter = parseGiantsFilter(resolvedSearchParams);
  const filtering = giantsFilterActive(filter);
  /** 右レールは単一選択 UI。複数指定時は先頭を採用 */
  const selectedTag = filtering ? (filter.tags[0] ?? null) : null;

  const [tags, listed] = await Promise.all([
    listGiantsTags().catch(() => [] as string[]),
    listGiants(
      selectedTag ? { tags: [selectedTag] } : undefined,
    ).catch(() => ({ items: [] as ShouldersOfGiants[], total: 0 })),
  ]);

  const sanitized = listed.items.map((item) => ({
    ...item,
    body_html: sanitizeBody(item.body_html),
  }));

  const items = shuffleItems(sanitized);

  return (
    <SiteShell
      bodyClassName="is-shoulders-of-giants"
      showTagsAside={false}
      showTagsRail
      tagsRailDefaultOpen
      breadcrumbFilter={selectedTag ? summarizeGiantsFilter({
        tags: [selectedTag],
      }) : null}
      breadcrumbSectionHref="/shoulders-of-giants/"
      filterActive={Boolean(selectedTag)}
      aside={
        tags.length ? (
          <ReadingTopicsAside
            tags={tags}
            hrefFor={giantsTagHref}
            allHref="/shoulders-of-giants/"
            selected={selectedTag}
          />
        ) : undefined
      }
    >
      <GiantsBrowse
        items={items}
        selectedTag={selectedTag}
      />
    </SiteShell>
  );
}
