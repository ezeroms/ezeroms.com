import type { Metadata } from "next";
import { ColumnFilterPanel } from "@/components/ColumnFilterPanel";
import { SiteShell } from "@/components/SiteShell";
import { ReadingTagsAside } from "@/components/ReadingTagsAside";
import {
  writingColumnClass,
  WritingIndexList,
} from "@/components/WritingIndexList";
import {
  columnExcerpt,
  columnThumbSrc,
  formatColumnDate,
} from "@/lib/content/column-meta";
import { cn } from "@/lib/cn";
import {
  columnFilterActive,
  columnTagHref,
  parseColumnFilter,
} from "@/lib/content/column-filter";
import { listingMetadataForSection } from "@/lib/content/section-listing-metadata";
import { summarizeColumnFilter } from "@/lib/site/breadcrumb-filters";
import {
  listColumn,
  listColumnTaxonomy,
  requirePublicWritingSection,
} from "@/lib/content/queries";
import { getWritingSection } from "@/lib/content/writing-sections";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return listingMetadataForSection(
    () => requirePublicWritingSection("column"),
    getWritingSection("column"),
  );
}

export default async function ColumnIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const section = await requirePublicWritingSection("column");
  const resolvedSearchParams = await searchParams;
  const parsed = parseColumnFilter(resolvedSearchParams);
  // Column has no weekday facet on the public site
  const filter = { ...parsed, weekdays: [] as number[] };
  const filtering = columnFilterActive(filter);

  const [taxonomy, listed] = await Promise.all([
    listColumnTaxonomy().catch(() => ({ tags: [] })),
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
      mainClassName="layout-main--single"
      contentClassName="p-0"
      breadcrumbFilter={filtering ? summarizeColumnFilter(filter) : null}
      breadcrumbSectionHref="/column/"
      aside={
        taxonomy.tags.length ? (
          <ReadingTagsAside
            tags={taxonomy.tags}
            hrefFor={columnTagHref}
            allHref="/column/"
            selected={filter.tags.length === 1 ? filter.tags[0] : filter.tags}
          />
        ) : undefined
      }
    >
      <div className={cn(writingColumnClass, "pb-16 pt-8")}>
        <WritingIndexList
          listId="column-articles-list"
          empty="まだ記事がありません。"
          items={listed.items.map((item) => {
            const tags = [...(item.column_tag ?? [])].sort((a, b) =>
              a.localeCompare(b, "ja"),
            );
            return {
              id: item.id,
              href: `/column/${item.slug}/`,
              label: item.title,
              image: columnThumbSrc(
                item.body_html,
                item.og_image,
                item.slug,
                section.og_image || null,
              ),
              dateLabel: formatColumnDate(item.date),
              dateTime: item.date,
              title: item.title,
              excerpt: columnExcerpt(item.body_html, 160),
              tags: tags.slice(0, 4).map((tag) => ({
                label: tag,
                href: columnTagHref(tag),
                active: filter.tags.length === 1 && filter.tags[0] === tag,
              })),
            };
          })}
        />
      </div>
    </SiteShell>
  );
}
