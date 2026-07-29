import { SiteShell } from "@/components/SiteShell";
import { NotesTimeline } from "@/components/NotesTimeline";
import { NotesFilterPanel } from "@/components/NotesFilterPanel";
import { emptyNotesFilter } from "@/lib/content/notes-filter";
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

  const initial = { ...emptyNotesFilter(), places: [decoded] };

  return (
    <SiteShell
      bodyClassName="is-diary"
      secondary={
        <NotesFilterPanel
          tags={taxonomy.tags}
          places={taxonomy.places}
          initial={initial}
        />
      }
      showTagsAside
      mainClassName="layout-main--single"
      breadcrumbCurrent={decoded}
      filterActive
    >
      <NotesTimeline items={sanitized} />
    </SiteShell>
  );
}
