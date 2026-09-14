import { SiteShell } from "@/components/SiteShell";
import { DiaryTimeline } from "@/components/DiaryTimeline";
import { DiaryFilterPanel } from "@/components/DiaryFilterPanel";
import { ReadingTagsAside } from "@/components/ReadingTagsAside";
import { emptyDiaryFilter, diaryTagHref } from "@/lib/content/diary-filter";
import {
  listDiary,
  listDiaryTaxonomy,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

export default async function DiaryTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const [{ items }, taxonomy] = await Promise.all([
    listDiary({ tag: decoded }),
    listDiaryTaxonomy().catch(() => ({ tags: [] })),
  ]);
  const sanitized = items.map((item) => ({
    ...item,
    body_html: sanitizeBody(item.body_html),
  }));

  const initial = { ...emptyDiaryFilter(), tags: [decoded] };

  return (
    <SiteShell
      bodyClassName="is-diary"
      secondary={
        <DiaryFilterPanel
          tags={taxonomy.tags}
          initial={initial}
        />
      }
      mainClassName="layout-main--single"
      breadcrumbCurrent={`#${decoded}`}
      filterActive
      aside={
        taxonomy.tags.length ? (
          <ReadingTagsAside
            tags={taxonomy.tags}
            hrefFor={diaryTagHref}
            allHref="/diary/"
            selected={decoded}
          />
        ) : undefined
      }
    >
      <DiaryTimeline items={sanitized} currentTag={decoded} />
    </SiteShell>
  );
}
