import { AboutShell } from "@/components/AboutShell";
import { MediaCoverageList } from "@/components/MediaCoverageList";
import {
  listMediaCoverage,
  requirePublicLibrarySection,
} from "@/lib/content/queries";

export const revalidate = 60;

export default async function MediaCoveragePage() {
  await requirePublicLibrarySection("media-coverage");
  const items = await listMediaCoverage();
  return (
    <AboutShell pathname="/about/media-coverage/" wide>
      <MediaCoverageList items={items} />
    </AboutShell>
  );
}
