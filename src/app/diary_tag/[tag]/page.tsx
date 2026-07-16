import { SiteShell } from "@/components/SiteShell";
import { DiaryTimeline } from "@/components/DiaryTimeline";
import { MobileHeader } from "@/components/MobileHeader";
import { NotesFilterPanel } from "@/components/NotesFilterPanel";
import { emptyNotesFilter } from "@/lib/content/notes-filter";
import {
  listDiary,
  listDiaryMonths,
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
  const [months, { items }, taxonomy] = await Promise.all([
    listDiaryMonths(),
    listDiary({ tag: decoded }),
    listDiaryTaxonomy().catch(() => ({ tags: [], places: [] })),
  ]);
  const sanitized = items.map((item) => ({
    ...item,
    body_html: sanitizeBody(item.body_html),
  }));

  const initial = { ...emptyNotesFilter(), tags: [decoded] };

  return (
    <SiteShell
      bodyClassName="is-diary"
      mobileHeader={<MobileHeader title={`#${decoded}`} />}
      secondary={
        <NotesFilterPanel
          months={months}
          tags={taxonomy.tags}
          places={taxonomy.places}
          initial={initial}
        />
      }
      showTagsAside
    >
      <DiaryTimeline items={sanitized} currentTag={decoded} />
    </SiteShell>
  );
}
