import type { Metadata } from "next";
import { ExperienceChart } from "@/components/ExperienceChart";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import { listExperience, requirePublicWorksSection } from "@/lib/content/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const section = await requirePublicWorksSection("experience").catch(() => null);
  return {
    title: section?.label ?? "Experience",
    description: "いつ・どこで・何に関わったか。職歴と関与の年表です。",
  };
}

export default async function ExperiencePage() {
  const section = await requirePublicWorksSection("experience");
  const items = await listExperience().catch(() => []);

  return (
    <SiteShell
      bodyClassName="is-works-experience"
      mobileHeader={<MobileHeader title={section.label} />}
      mainClassName="layout-main--single"
      showTagsAside={false}
      contentClassName="p-0"
    >
      <ExperienceChart items={items} />
    </SiteShell>
  );
}
