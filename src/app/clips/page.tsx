import type { Metadata } from "next";
import { ClipsMasonry } from "@/components/ClipsMasonry";
import { MobileHeader } from "@/components/MobileHeader";
import { NotesFilterPanel } from "@/components/NotesFilterPanel";
import { SiteShell } from "@/components/SiteShell";
import {
  notesFilterActive,
  parseNotesFilter,
} from "@/lib/content/notes-filter";
import {
  listClip,
  listClipMonths,
  listClipTags,
} from "@/lib/content/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Clips",
  description: "Webのニュースや記事のクリップ。出典と短いメモだけを残す場所です。",
};

export default async function ClipsIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter = parseNotesFilter(sp);
  // Clips have no place facet
  const clipFilter = { ...filter, places: [] as string[] };
  const filtering = notesFilterActive(clipFilter);

  const [months, tags, listed] = await Promise.all([
    listClipMonths().catch(() => [] as string[]),
    listClipTags().catch(() => [] as string[]),
    listClip(
      filtering
        ? {
            months: clipFilter.months,
            weekdays: clipFilter.weekdays,
            tags: clipFilter.tags,
          }
        : undefined,
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  return (
    <SiteShell
      bodyClassName="is-clips"
      mobileHeader={<MobileHeader title="Clips" />}
      secondary={
        <NotesFilterPanel
          months={months}
          tags={tags}
          places={[]}
          showPlaces={false}
          initial={clipFilter}
          basePath="/clips/"
        />
      }
      showTagsAside
    >
      <div className="w-full py-0 font-sans text-foreground">
        <ClipsMasonry items={listed.items} activeTags={clipFilter.tags} />
      </div>
    </SiteShell>
  );
}
