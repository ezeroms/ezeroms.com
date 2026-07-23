import type { Metadata } from "next";
import { ChronicleFilterPanel } from "@/components/ChronicleFilterPanel";
import { ChronicleMatrix } from "@/components/ChronicleMatrix";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import {
  chronicleFilterActive,
  parseChronicleFilter,
} from "@/lib/content/chronicle-filter";
import { resolveChronicleThemes } from "@/lib/content/chronicle-themes";
import { summarizeChronicleFilter } from "@/lib/site/breadcrumb-filters";
import {
  listChronicle,
  listChronicleTaxonomy,
  requirePublicLibrarySection,
} from "@/lib/content/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const section = await requirePublicLibrarySection("chronicle").catch(
    () => null,
  );
  return {
    title: section?.label ?? "Chronicle",
    description:
      "関心ごとの年表。テーマを横軸・時系列を縦軸に、出来事を横断して辿ります。",
  };
}

export default async function ChroniclePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const section = await requirePublicLibrarySection("chronicle");
  const resolvedSearchParams = await searchParams;
  const filter = parseChronicleFilter(resolvedSearchParams);
  const filtering = chronicleFilterActive(filter);

  const [taxonomy, listed] = await Promise.all([
    listChronicleTaxonomy().catch(() => ({
      years: [] as string[],
      tags: [] as string[],
      categories: [] as string[],
    })),
    listChronicle(
      filtering
        ? {
            years: filter.years,
            tags: filter.tags,
            interests: filter.interests,
          }
        : undefined,
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  const themes = resolveChronicleThemes(
    taxonomy.tags,
    filter.tags,
    listed.items,
  );

  return (
    <SiteShell
      bodyClassName="is-chronicle"
      mobileHeader={<MobileHeader title={section.label} />}
      contentClassName="p-0"
      secondary={
        <ChronicleFilterPanel
          years={taxonomy.years}
          tags={taxonomy.tags}
          initial={filter}
          basePath="/chronicle/"
        />
      }
      showTagsAside
      breadcrumbFilter={filtering ? summarizeChronicleFilter(filter) : null}
      breadcrumbSectionHref="/chronicle/"
    >
      <div className="h-[calc(100dvh-2.75rem)]">
        <ChronicleMatrix items={listed.items} themes={themes} />
      </div>
    </SiteShell>
  );
}
