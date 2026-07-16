import { AboutShell } from "@/components/AboutToc";
import { MediaCoverageList } from "@/components/MediaCoverageList";
import { listMediaCoverage } from "@/lib/content/queries";

export const revalidate = 60;

export default async function MediaCoveragePage() {
  const items = await listMediaCoverage();

  return (
    <AboutShell pathname="/about/media-coverage/" wide>
      <MediaCoverageList items={items} />
    </AboutShell>
  );
}
