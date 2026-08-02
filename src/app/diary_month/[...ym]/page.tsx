import { redirect } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { NotesTimeline } from "@/components/NotesTimeline";
import { NotesFilterPanel } from "@/components/NotesFilterPanel";
import { dateRangeFromYearMonths } from "@/lib/content/date-range";
import { emptyNotesFilter, formatMonthLabel } from "@/lib/content/notes-filter";
import {
  listDiary,
  listDiaryTaxonomy,
} from "@/lib/content/queries";
import { sanitizeBody } from "@/lib/html";

export const revalidate = 60;

function normalizeMonthKey(raw: string): string {
  const slash = raw.match(/^(\d{4})\/(\d{1,2})(?:\/\d{1,2})?$/);
  if (slash) return `${slash[1]}-${slash[2].padStart(2, "0")}`;
  return raw;
}

export default async function DiaryMonthPage({
  params,
}: {
  params: Promise<{ ym: string[] }>;
}) {
  const { ym: parts } = await params;
  const raw = parts.map(decodeURIComponent).join("/");
  const month = normalizeMonthKey(raw);
  if (raw !== month) redirect(`/diary_month/${month}/`);

  const [{ items }, taxonomy] = await Promise.all([
    listDiary({ month }),
    listDiaryTaxonomy().catch(() => ({ tags: [], places: [] })),
  ]);
  const sanitized = items.map((item) => ({
    ...item,
    body_html: sanitizeBody(item.body_html),
  }));

  const range = dateRangeFromYearMonths([month]);
  const initial = { ...emptyNotesFilter(), ...range };

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
      breadcrumbCurrent={formatMonthLabel(month) || month}
      filterActive
    >
      <NotesTimeline items={sanitized} />
    </SiteShell>
  );
}
