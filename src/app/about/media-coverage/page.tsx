import type { Metadata } from "next";
import { AboutShell } from "@/components/AboutShell";
import { MediaCoverageList } from "@/components/MediaCoverageList";
import { listingMetadataForSection } from "@/lib/content/section-listing-metadata";
import {
  listMediaCoverage,
  requirePublicLibrarySection,
} from "@/lib/content/queries";
import { getLibrarySection } from "@/lib/content/library-sections";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return listingMetadataForSection(
    () => requirePublicLibrarySection("media-coverage"),
    getLibrarySection("media-coverage"),
  );
}

export default async function MediaCoveragePage() {
  const section = await requirePublicLibrarySection("media-coverage");
  const items = await listMediaCoverage();
  return (
    <AboutShell bodyClassName="is-media-coverage">
      <MediaCoverageList
        items={items}
        fallbackThumbSrc={section.og_image || null}
      />
    </AboutShell>
  );
}
