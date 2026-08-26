import type { Metadata } from "next";
import { ExperienceChart } from "@/components/ExperienceChart";
import { SiteShell } from "@/components/SiteShell";
import { listingMetadataForSection } from "@/lib/content/section-listing-metadata";
import { listExperience, requirePublicWorksSection } from "@/lib/content/queries";
import { getWorksSection } from "@/lib/content/works-sections";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return listingMetadataForSection(
    () => requirePublicWorksSection("experience"),
    getWorksSection("experience"),
  );
}

export default async function ExperiencePage() {
  const section = await requirePublicWorksSection("experience");
  const items = await listExperience().catch(() => []);

  return (
    <SiteShell
      bodyClassName="is-works-experience"
      mainClassName="layout-main--single"
      contentClassName="p-0"
    >
      <ExperienceChart items={items} />
    </SiteShell>
  );
}
