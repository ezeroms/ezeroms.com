import { redirect } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { DiaryTimeline } from "@/components/DiaryTimeline";
import { MobileHeader } from "@/components/MobileHeader";
import { NotesFilterPanel } from "@/components/NotesFilterPanel";
import { emptyNotesFilter, formatMonthLabel } from "@/lib/content/notes-filter";
import {
  listDiary,
  listDiaryMonths,
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

  const [months, { items }, taxonomy] = await Promise.all([
    listDiaryMonths(),
    listDiary({ month }),
    listDiaryTaxonomy().catch(() => ({ tags: [], places: [] })),
  ]);
  const sanitized = items.map((item) => ({
    ...item,
    body_html: sanitizeBody(item.body_html),
  }));

  const initial = { ...emptyNotesFilter(), months: [month] };

  return (
    <SiteShell
      bodyClassName="is-diary"
      mobileHeader={<MobileHeader title={month} />}
      secondary={
        <NotesFilterPanel
          months={months}
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
      <DiaryTimeline items={sanitized} />
    </SiteShell>
  );
}
