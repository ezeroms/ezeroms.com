import type { Metadata } from "next";
import { ClipsBrowse } from "@/components/ClipsBrowse";
import { DiaryFilterPanel } from "@/components/DiaryFilterPanel";
import { SiteShell } from "@/components/SiteShell";
import {
  diaryFilterActive,
  parseDiaryFilter,
} from "@/lib/content/diary-filter";
import { sectionListingMetadata } from "@/lib/content/section-listing-metadata";
import { summarizeDiaryFilter } from "@/lib/site/breadcrumb-filters";
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
      showTagsAside={false}
      breadcrumbFilter={filtering ? summarizeDiaryFilter(clipFilter) : null}
      breadcrumbSectionHref="/clips/"
      filterActive={filtering}
      mainContentClassName="min-[1080px]:flex min-[1080px]:flex-col min-[1080px]:overflow-hidden"
      contentClassName={
        "flex w-full flex-col p-4 min-[768px]:p-5 min-[1080px]:min-h-0 min-[1080px]:flex-1 min-[1080px]:overflow-hidden min-[1080px]:p-6"
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
