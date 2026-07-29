import type { Metadata } from "next";
import { ClipsMasonry } from "@/components/ClipsMasonry";
import { NotesFilterPanel } from "@/components/NotesFilterPanel";
import { SiteShell } from "@/components/SiteShell";
import {
  notesFilterActive,
  parseNotesFilter,
} from "@/lib/content/notes-filter";
import { sectionListingMetadata } from "@/lib/content/section-listing-metadata";
import { summarizeNotesFilter } from "@/lib/site/breadcrumb-filters";
import {
  listClip,
  listClipTags,
  requirePublicLibrarySection,
} from "@/lib/content/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const section = await requirePublicLibrarySection("clips").catch(() => null);
  return sectionListingMetadata({
    title: section?.label ?? "Clips",
    description:
      "Webのニュースや記事のクリップ。出典と短いメモだけを残す場所です。",
    ogImage: section?.og_image,
  });
}

export default async function ClipsIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const section = await requirePublicLibrarySection("clips");
  const resolvedSearchParams = await searchParams;
  const filter = parseNotesFilter(resolvedSearchParams);
  // Clips have no place / weekday facets
  const clipFilter = {
    ...filter,
    places: [] as string[],
    weekdays: [] as number[],
  };
  const filtering = notesFilterActive(clipFilter);

  const [tags, listed] = await Promise.all([
    listClipTags().catch(() => [] as string[]),
    listClip(
      filtering
        ? {
            from: clipFilter.from,
            to: clipFilter.to,
            tags: clipFilter.tags,
          }
        : undefined,
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  return (
    <SiteShell
      bodyClassName="is-clips"
      secondary={
        <NotesFilterPanel
          tags={tags}
          places={[]}
          showPlaces={false}
          showWeekdays={false}
          initial={clipFilter}
          basePath="/clips/"
        />
      }
      showTagsAside
      breadcrumbFilter={filtering ? summarizeNotesFilter(clipFilter) : null}
      breadcrumbSectionHref="/clips/"
    >
      <div className="w-full py-0 font-sans text-foreground">
        <ClipsMasonry
          items={listed.items}
          activeTags={clipFilter.tags}
          fallbackThumbSrc={section.og_image || null}
        />
      </div>
    </SiteShell>
  );
}
