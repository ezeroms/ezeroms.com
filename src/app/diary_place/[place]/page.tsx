import { SiteShell } from "@/components/SiteShell";
import { DiaryTimeline } from "@/components/DiaryTimeline";
import { DiaryFilterPanel } from "@/components/DiaryFilterPanel";
import {
  ReadingTopicsAside,
  diaryTagHref,
} from "@/components/ReadingTopicsAside";
import { emptyDiaryFilter } from "@/lib/content/diary-filter";
import {
  listDiary,
  listDiaryTaxonomy,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

export default async function DiaryPlacePage({
  params,
}: {
  params: Promise<{ place: string }>;
}) {
  const { place } = await params;
  const decoded = decodeURIComponent(place);
  const [{ items }, taxonomy] = await Promise.all([
    listDiary({ place: decoded }),
    listDiaryTaxonomy().catch(() => ({ tags: [], places: [] })),
  ]);
  const sanitized = items.map((item) => ({
    ...item,
    body_html: sanitizeBody(item.body_html),
  }));

  const initial = { ...emptyDiaryFilter(), places: [decoded] };

  return (
    <SiteShell
      bodyClassName="is-diary"
      secondary={
        <DiaryFilterPanel
          tags={taxonomy.tags}
          places={taxonomy.places}
          initial={initial}
        />
      }
      showTagsAside
      mainClassName="layout-main--single"
      breadcrumbCurrent={decoded}
      filterActive
      aside={
        taxonomy.tags.length ? (
          <ReadingTopicsAside
            tags={taxonomy.tags}
            hrefFor={diaryTagHref}
            allHref="/diary/"
          />
        ) : undefined
      }
    >
      <DiaryTimeline items={sanitized} />
    </SiteShell>
  );
}
