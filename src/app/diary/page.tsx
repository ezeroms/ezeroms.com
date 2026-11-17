import type { Metadata } from "next";
import { DiaryFilterPanel } from "@/components/DiaryFilterPanel";
import { DiaryList } from "@/components/DiaryList";
import { SiteShell } from "@/components/SiteShell";
import { ReadingTagsAside } from "@/components/ReadingTagsAside";
import { writingColumnClass } from "@/components/WritingIndexList";
import { cn } from "@/lib/cn";
import {
  diaryFilterActive,
  diaryListTagHref,
  parseDiaryFilter,
} from "@/lib/content/diary-filter";
import { listingMetadataForSection } from "@/lib/content/section-listing-metadata";
import { summarizeDiaryFilter } from "@/lib/site/breadcrumb-filters";
import {
  listDiary,
  listDiaryTaxonomy,
  requirePublicWritingSection,
} from "@/lib/content/queries";
import { getWritingSection } from "@/lib/content/writing-sections";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return listingMetadataForSection(
    () => requirePublicWritingSection("diary"),
    getWritingSection("diary"),
  );
}

export default async function DiaryIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const section = await requirePublicWritingSection("diary");
  const resolvedSearchParams = await searchParams;
  const filter = parseDiaryFilter(resolvedSearchParams);
  const filtering = diaryFilterActive(filter);

  const [taxonomy, listed] = await Promise.all([
    listDiaryTaxonomy().catch(() => ({ tags: [] })),
    listDiary(
      filtering
        ? {
            from: filter.from,
            to: filter.to,
            weekdays: filter.weekdays,
            tags: filter.tags,
          }
        : undefined,
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  return (
    <SiteShell
      bodyClassName="is-diary"
      secondary={
        <DiaryFilterPanel tags={taxonomy.tags} initial={filter} />
      }
      mainClassName="layout-main--single"
      contentClassName="p-0"
      breadcrumbFilter={filtering ? summarizeDiaryFilter(filter) : null}
      breadcrumbSectionHref="/diary/"
      aside={
        taxonomy.tags.length ? (
          <ReadingTagsAside
            tags={taxonomy.tags}
            hrefFor={diaryListTagHref}
            allHref="/diary/"
            selected={filter.tags.length === 1 ? filter.tags[0] : filter.tags}
          />
        ) : undefined
      }
    >
      <div className={cn(writingColumnClass, "pb-16 pt-8")}>
        <DiaryList
          items={listed.items}
          fallbackThumbSrc={section.og_image || null}
          currentTag={filter.tags.length === 1 ? filter.tags[0] : undefined}
        />
      </div>
    </SiteShell>
  );
}
