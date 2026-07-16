import type { Metadata } from "next";
import { GiantsFilterPanel } from "@/components/GiantsFilterPanel";
import { GiantsTimeline } from "@/components/GiantsTimeline";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import {
  giantsFilterActive,
  parseGiantsFilter,
} from "@/lib/content/giants-filter";
import { listGiants, listGiantsTopics } from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

/** Recent stream when no topic filter (Notes-style). */
const GIANTS_FEED_LIMIT = 50;

export const metadata: Metadata = {
  title: "The shoulders of Giants",
  description: "影響を受けた人・作品・考え方のメモ。",
};

export default async function GiantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter = parseGiantsFilter(sp);
  const filtering = giantsFilterActive(filter);

  const [topics, listed] = await Promise.all([
    listGiantsTopics().catch(() => [] as string[]),
    listGiants(
      filtering
        ? { topics: filter.topics }
        : { limit: GIANTS_FEED_LIMIT },
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  const sanitized = listed.items.map((item) => ({
    ...item,
    body_html: sanitizeBody(item.body_html),
  }));

  const hasMore = !filtering && listed.total > listed.items.length;

  return (
    <SiteShell
      bodyClassName="is-shoulders-of-giants"
      mobileHeader={<MobileHeader title="The shoulders of Giants" />}
      secondary={
        <GiantsFilterPanel topics={topics} initial={filter} />
      }
      showTagsAside
    >
      <GiantsTimeline items={sanitized} activeTopics={filter.topics} />
      {hasMore ? (
        <p className="notes-feed-more pb-8 text-sm text-muted-foreground">
          最新 {listed.items.length} 件を表示しています。それ以外は右のトピック絞り込みからどうぞ。
        </p>
      ) : null}
    </SiteShell>
  );
}
