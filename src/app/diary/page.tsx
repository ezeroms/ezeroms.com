import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { DiaryTimeline } from "@/components/DiaryTimeline";
import { MobileHeader } from "@/components/MobileHeader";
import { NotesFilterPanel } from "@/components/NotesFilterPanel";
import { diaryMonthKey } from "@/lib/content/diary-meta";
import {
  notesFilterActive,
  parseNotesFilter,
} from "@/lib/content/notes-filter";
import {
  listDiary,
  listDiaryMonths,
  listDiaryTaxonomy,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

/** Notes top: recent stream when no filters. */
const NOTES_FEED_LIMIT = 50;

export const metadata: Metadata = {
  title: "Notes",
  description: "日常の短いメモとスナップ。気づきや記録を残す場所です。",
};

export default async function DiaryIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter = parseNotesFilter(sp);
  const filtering = notesFilterActive(filter);

  const [months, taxonomy, listed] = await Promise.all([
    listDiaryMonths().catch(() => [] as string[]),
    listDiaryTaxonomy().catch(() => ({ tags: [], places: [] })),
    listDiary(
      filtering
        ? {
            months: filter.months,
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
  const continueMonth = oldestInFeed ? diaryMonthKey(oldestInFeed) : "";
  const hasMore = !filtering && total > items.length;

  return (
    <SiteShell
      bodyClassName="is-diary"
      mobileHeader={<MobileHeader title="Notes" />}
      secondary={
        <NotesFilterPanel
          months={months}
          tags={taxonomy.tags}
          places={taxonomy.places}
          initial={filter}
        />
      }
      showTagsAside
    >
      <DiaryTimeline items={sanitized} />
      {hasMore && continueMonth ? (
        <p className="notes-feed-more pb-8">
          最新 {items.length} 件を表示しています。それ以前は{" "}
          <Link href={`/diary_month/${continueMonth}/`}>月別アーカイブ</Link>
          や右の絞り込みからどうぞ。
        </p>
      ) : null}
    </SiteShell>
  );
}
