import type { Metadata } from "next";
import { ColumnFilterPanel } from "@/components/ColumnFilterPanel";
import { ColumnList } from "@/components/ColumnList";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import {
  columnFilterActive,
  parseColumnFilter,
} from "@/lib/content/column-filter";
import { summarizeColumnFilter } from "@/lib/site/breadcrumb-filters";
import {
  listColumn,
  listColumnMonths,
  listColumnTaxonomy,
} from "@/lib/content/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Column",
  description:
    "長めの記事。技術・考察・エッセイなど、きちんと書き切る場所です。",
};

export default async function ColumnIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const filter = parseColumnFilter(resolvedSearchParams);
  const filtering = columnFilterActive(filter);

  const [months, taxonomy, listed] = await Promise.all([
    listColumnMonths().catch(() => [] as string[]),
    listColumnTaxonomy().catch(() => ({ categories: [], tags: [] })),
    listColumn(
      filtering
        ? {
            months: filter.months,
            weekdays: filter.weekdays,
            categories: filter.categories,
            tags: filter.tags,
          }
        : undefined,
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  return (
    <SiteShell
      bodyClassName="is-column"
      mobileHeader={<MobileHeader title="Column" />}
      secondary={
        <ColumnFilterPanel
          months={months}
          categories={taxonomy.categories}
          tags={taxonomy.tags}
          initial={filter}
          basePath="/column/"
        />
      }
      showTagsAside
      mainClassName="layout-main--single"
      breadcrumbFilter={filtering ? summarizeColumnFilter(filter) : null}
      breadcrumbSectionHref="/column/"
    >
      <ColumnList
        items={listed.items}
        listId="column-articles-list"
        currentCategory={
          filter.categories.length === 1 ? filter.categories[0] : undefined
        }
        currentTag={filter.tags.length === 1 ? filter.tags[0] : undefined}
      />
    </SiteShell>
  );
}
