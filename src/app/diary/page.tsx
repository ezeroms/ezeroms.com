import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { DiaryTimeline } from "@/components/DiaryTimeline";
import { DiaryFilterPanel } from "@/components/DiaryFilterPanel";
import { ReadingTagsAside } from "@/components/ReadingTagsAside";
import { diaryMonthKey } from "@/lib/content/diary-meta";
import {
  diaryFilterActive,
  diaryTagHref,
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
import { listingMoreClass } from "@/lib/site/prose-styles";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

/** Diary top: recent stream when no filters. */
const DIARY_FEED_LIMIT = 50;

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
  await requirePublicWritingSection("diary");
  const resolvedSearchParams = await searchParams;
  const filter = parseDiaryFilter(resolvedSearchParams);
  const filtering = diaryFilterActive(filter);

  const [taxonomy, listed] = await Promise.all([
    listDiaryTaxonomy().catch(() => ({ tags: [], places: [] })),
    listDiary(
      filtering
        ? {
            from: filter.from,
            to: filter.to,
            weekdays: filter.weekdays,
            tags: filter.tags,
            places: filter.places,
          }
        : { limit: DIARY_FEED_LIMIT },
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  const { items, total } = listed;
  const sanitized = items.map((item) => ({
    ...item,
    body_html: sanitizeBody(item.body_html),
  }));

  const oldestInFeed = items[items.length - 1];
  const continueMonth = oldestInFeed ? diaryMonthKey(oldestInFeed) : "";
  const hasMore = !filtering && total > items.length;

  return (
    <SiteShell
      bodyClassName="is-diary"
      secondary={
        <DiaryFilterPanel
          tags={taxonomy.tags}
          places={taxonomy.places}
          initial={filter}
        />
      }
      mainClassName="layout-main--single"
      breadcrumbFilter={filtering ? summarizeDiaryFilter(filter) : null}
      breadcrumbSectionHref="/diary/"
      aside={
        taxonomy.tags.length ? (
          <ReadingTagsAside
            tags={taxonomy.tags}
            hrefFor={diaryTagHref}
            allHref="/diary/"
            selected={filter.tags.length === 1 ? filter.tags[0] : filter.tags}
          />
        ) : undefined
      }
    >
      <DiaryTimeline items={sanitized} />
      {hasMore && continueMonth ? (
        <p className={listingMoreClass}>
          最新 {items.length} 件を表示しています。それ以前は{" "}
          <Link href={`/diary_month/${continueMonth}/`}>月別アーカイブ</Link>
          やヘッダーの Search から条件を指定してください。
        </p>
      ) : null}
    </SiteShell>
  );
}
