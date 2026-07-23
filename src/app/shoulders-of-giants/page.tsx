import type { Metadata } from "next";
import { GiantsBrowse } from "@/components/GiantsBrowse";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import {
  giantsFilterActive,
  parseGiantsFilter,
} from "@/lib/content/giants-filter";
import { summarizeGiantsFilter } from "@/lib/site/breadcrumb-filters";
import {
  listGiants,
  listGiantsTopics,
  requirePublicLibrarySection,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";
import type { ShouldersOfGiants } from "@/types/content";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const section = await requirePublicLibrarySection("giants").catch(() => null);
  return {
    title: section?.label ?? "The shoulders of Giants",
    description: "影響を受けた人・作品・考え方のメモ。",
  };
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
  /** 左ロールは単一選択 UI。複数指定時は先頭を採用 */
  const selectedTopic = filtering ? (filter.topics[0] ?? null) : null;

  const [topics, listed] = await Promise.all([
    listGiantsTopics().catch(() => [] as string[]),
    listGiants(
      selectedTopic ? { topics: [selectedTopic] } : undefined,
    ).catch(() => ({ items: [] as ShouldersOfGiants[], total: 0 })),
  ]);

  const sanitized = listed.items.map((item) => ({
    ...item,
    body_html: sanitizeBody(item.body_html),
  }));

  const items = selectedTopic ? sanitized : shuffleItems(sanitized);

  return (
    <SiteShell
      bodyClassName="is-shoulders-of-giants"
      mobileHeader={<MobileHeader title={section.label} />}
      showTagsAside={false}
      breadcrumbFilter={selectedTopic ? summarizeGiantsFilter({
        topics: [selectedTopic],
      }) : null}
      breadcrumbSectionHref="/shoulders-of-giants/"
      filterActive={Boolean(selectedTopic)}
    >
      <GiantsBrowse
        topics={topics}
        items={items}
        selectedTopic={selectedTopic}
      />
    </SiteShell>
  );
}
