import type { Metadata } from "next";
import { ColumnFilterPanel } from "@/components/ColumnFilterPanel";
import { ColumnList } from "@/components/ColumnList";
import { SiteShell } from "@/components/SiteShell";
import {
  ReadingTopicsAside,
  columnTagHref,
} from "@/components/ReadingTopicsAside";
import {
  columnFilterActive,
  parseColumnFilter,
} from "@/lib/content/column-filter";
import { sectionListingMetadata } from "@/lib/content/section-listing-metadata";
import { summarizeColumnFilter } from "@/lib/site/breadcrumb-filters";
import {
  listColumn,
  listColumnTaxonomy,
  requirePublicWritingSection,
} from "@/lib/content/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const section = await requirePublicWritingSection("column").catch(() => null);
  return sectionListingMetadata({
    title: section?.label ?? "Column",
    description:
      section?.description ??
      "長めの記事。技術・考察・エッセイなど、きちんと書き切る場所です。",
    ogImage: section?.og_image,
  });
}

export default async function ColumnIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const section = await requirePublicWritingSection("column");
  const resolvedSearchParams = await searchParams;
  const parsed = parseColumnFilter(resolvedSearchParams);
  // Column has no weekday / category facet on the public site
  const filter = { ...parsed, weekdays: [] as number[], categories: [] as string[] };
  const filtering = columnFilterActive(filter);

  const [taxonomy, listed] = await Promise.all([
    listColumnTaxonomy().catch(() => ({ categories: [], tags: [] })),
    listColumn(
      filtering
        ? {
            from: filter.from,
            to: filter.to,
            tags: filter.tags,
          }
        : undefined,
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  return (
    <SiteShell
      bodyClassName="is-column"
      secondary={
        <ColumnFilterPanel
          tags={taxonomy.tags}
          initial={filter}
          basePath="/column/"
        />
      }
      showTagsAside
      mainClassName="layout-main--single"
      breadcrumbFilter={filtering ? summarizeColumnFilter(filter) : null}
      breadcrumbSectionHref="/column/"
      aside={
        taxonomy.tags.length ? (
          <ReadingTopicsAside
            tags={taxonomy.tags}
            hrefFor={columnTagHref}
            allHref="/column/"
            selected={filter.tags.length === 1 ? filter.tags[0] : filter.tags}
          />
        ) : undefined
      }
    >
      <ColumnList
        items={listed.items}
        listId="column-articles-list"
        fallbackThumbSrc={section.og_image || null}
        currentTag={filter.tags.length === 1 ? filter.tags[0] : undefined}
      />
    </SiteShell>
  );
}
