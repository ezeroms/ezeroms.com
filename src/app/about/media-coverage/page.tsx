import type { Metadata } from "next";
import { AboutShell } from "@/components/AboutShell";
import { MediaCoverageList } from "@/components/MediaCoverageList";
import { sectionListingMetadata } from "@/lib/content/section-listing-metadata";
import {
  listMediaCoverage,
  requirePublicLibrarySection,
} from "@/lib/content/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const section = await requirePublicLibrarySection("media-coverage").catch(
    () => null,
  );
  return sectionListingMetadata({
    title: section?.label ?? "Media coverage",
    description: "メディア掲載。",
    ogImage: section?.og_image,
  });
}

export default async function MediaCoveragePage() {
  const section = await requirePublicLibrarySection("media-coverage");
  const items = await listMediaCoverage();
  return (
    <AboutShell pathname="/about/media-coverage/" wide>
      <MediaCoverageList
        items={items}
        fallbackThumbSrc={section.og_image || null}
      />
    </AboutShell>
  );
}
