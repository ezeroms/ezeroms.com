import type { Metadata } from "next";
import { ExperienceChart } from "@/components/ExperienceChart";
import { SiteShell } from "@/components/SiteShell";
import { sectionListingMetadata } from "@/lib/content/section-listing-metadata";
import { listExperience, requirePublicWorksSection } from "@/lib/content/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const section = await requirePublicWorksSection("experience").catch(() => null);
  return sectionListingMetadata({
    title: section?.label ?? "Experience",
    description: "いつ・どこで・何に関わったか。職歴と関与の年表です。",
    ogImage: section?.og_image,
  });
}

export default async function ExperiencePage() {
  const section = await requirePublicWorksSection("experience");
  const items = await listExperience().catch(() => []);

  return (
    <SiteShell
      bodyClassName="is-works-experience"
      mainClassName="layout-main--single"
      showTagsAside={false}
      contentClassName="p-0"
    >
      <ExperienceChart items={items} />
    </SiteShell>
  );
}
