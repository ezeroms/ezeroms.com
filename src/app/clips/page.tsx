import type { Metadata } from "next";
import { ClipsBrowse } from "@/components/ClipsBrowse";
import { DiaryFilterPanel } from "@/components/DiaryFilterPanel";
import {
  ReadingTagsAside,
} from "@/components/ReadingTagsAside";
import { SiteShell } from "@/components/SiteShell";
import {
  diaryFilterActive,
  parseDiaryFilter,
} from "@/lib/content/diary-filter";
import { listingMetadataForSection } from "@/lib/content/section-listing-metadata";
import { summarizeDiaryFilter } from "@/lib/site/breadcrumb-filters";
import {
  listClip,
  listClipTags,
  requirePublicLibrarySection,
} from "@/lib/content/queries";
import { getLibrarySection } from "@/lib/content/library-sections";
import { clipHrefsForDate } from "@/lib/content/clip-meta";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return listingMetadataForSection(
    () => requirePublicLibrarySection("clips"),
    getLibrarySection("clips"),
  );
}

export default async function ClipsIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const section = await requirePublicLibrarySection("clips");
  const resolvedSearchParams = await searchParams;
  const filter = parseDiaryFilter(resolvedSearchParams);
  const clipFilter = {
    ...filter,
    places: [] as string[],
    weekdays: [] as number[],
  };
  const filtering = diaryFilterActive(clipFilter);
  const selectedTag = clipFilter.tags[0] ?? null;

  const [tags, listed] = await Promise.all([
    listClipTags().catch(() => [] as string[]),
    listClip(
      filtering
        ? {
            from: clipFilter.from,
            to: clipFilter.to,
            tags: selectedTag ? [selectedTag] : clipFilter.tags,
          }
        : undefined,
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  const clipHrefs = clipHrefsForDate(clipFilter);

  return (
    <SiteShell
      bodyClassName="is-clips"
      secondary={
        <DiaryFilterPanel
          tags={tags}
          places={[]}
          showPlaces={false}
          showWeekdays={false}
          showTags={false}
          initial={clipFilter}
          basePath="/clips/"
        />
      }
      showTagsRail
      tagsRailDefaultOpen
      breadcrumbFilter={filtering ? summarizeDiaryFilter(clipFilter) : null}
      breadcrumbSectionHref="/clips/"
      filterActive={filtering}
      aside={
        tags.length ? (
          <ReadingTagsAside
            tags={tags}
            hrefFor={clipHrefs.forTag}
            allHref={clipHrefs.all}
            selected={selectedTag}
          />
        ) : undefined
      }
    >
      <ClipsBrowse
        tags={tags}
        items={listed.items}
        selectedTag={selectedTag}
        dateFilter={{ from: clipFilter.from, to: clipFilter.to }}
        fallbackThumbSrc={section.og_image || null}
      />
    </SiteShell>
  );
}
