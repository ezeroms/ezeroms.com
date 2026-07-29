import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { NotesTimeline } from "@/components/NotesTimeline";
import { NotesFilterPanel } from "@/components/NotesFilterPanel";
import { notesMonthKey } from "@/lib/content/notes-meta";
import {
  notesFilterActive,
  parseNotesFilter,
} from "@/lib/content/notes-filter";
import { sectionListingMetadata } from "@/lib/content/section-listing-metadata";
import { summarizeNotesFilter } from "@/lib/site/breadcrumb-filters";
import {
  listDiary,
  listDiaryTaxonomy,
  requirePublicWritingSection,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

/** Notes top: recent stream when no filters. */
const NOTES_FEED_LIMIT = 50;

export async function generateMetadata(): Promise<Metadata> {
  const section = await requirePublicWritingSection("notes").catch(() => null);
  return sectionListingMetadata({
    title: section?.label ?? "Notes",
    description:
      section?.description ??
      "日常の短いメモとスナップ。気づきや記録を残す場所です。",
    ogImage: section?.og_image,
  });
}

export default async function DiaryIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePublicWritingSection("notes");
  const resolvedSearchParams = await searchParams;
  const filter = parseNotesFilter(resolvedSearchParams);
  const filtering = notesFilterActive(filter);

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
        : { limit: NOTES_FEED_LIMIT },
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  const { items, total } = listed;
  const sanitized = items.map((item) => ({
    ...item,
    body_html: sanitizeBody(item.body_html),
  }));

  const oldestInFeed = items[items.length - 1];
  const continueMonth = oldestInFeed ? notesMonthKey(oldestInFeed) : "";
  const hasMore = !filtering && total > items.length;

  return (
    <SiteShell
      bodyClassName="is-diary"
      secondary={
        <NotesFilterPanel
          tags={taxonomy.tags}
          places={taxonomy.places}
          initial={filter}
        />
      }
      showTagsAside
      mainClassName="layout-main--single"
      breadcrumbFilter={filtering ? summarizeNotesFilter(filter) : null}
      breadcrumbSectionHref="/diary/"
    >
      <NotesTimeline items={sanitized} />
      {hasMore && continueMonth ? (
        <p className="notes-feed-more mx-auto max-w-3xl pb-8">
          最新 {items.length} 件を表示しています。それ以前は{" "}
          <Link href={`/diary_month/${continueMonth}/`}>月別アーカイブ</Link>
          やヘッダーの Search から条件を指定してください。
        </p>
      ) : null}
    </SiteShell>
  );
}
