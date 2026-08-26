import type { Metadata } from "next";
import { ChronicleFilterPanel } from "@/components/ChronicleFilterPanel";
import { ChronicleMatrix } from "@/components/ChronicleMatrix";
import { SiteShell } from "@/components/SiteShell";
import {
  chronicleFilterActive,
  parseChronicleFilter,
} from "@/lib/content/chronicle-filter";
import { resolveChronicleThemes } from "@/lib/content/chronicle-themes";
import { listingMetadataForSection } from "@/lib/content/section-listing-metadata";
import { summarizeChronicleFilter } from "@/lib/site/breadcrumb-filters";
import {
  listChronicle,
  listChronicleTaxonomy,
  requirePublicLibrarySection,
} from "@/lib/content/queries";
import { getLibrarySection } from "@/lib/content/library-sections";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return listingMetadataForSection(
    () => requirePublicLibrarySection("chronicle"),
    getLibrarySection("chronicle"),
  );
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
            from: filter.from,
            to: filter.to,
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
      contentClassName="p-0"
      secondary={
        <ChronicleFilterPanel
          tags={taxonomy.tags}
          initial={filter}
          basePath="/chronicle/"
        />
      }
      breadcrumbFilter={filtering ? summarizeChronicleFilter(filter) : null}
      breadcrumbSectionHref="/chronicle/"
    >
      <div className="h-[calc(100dvh-2.75rem)]">
        <ChronicleMatrix items={listed.items} themes={themes} />
      </div>
    </SiteShell>
  );
}
