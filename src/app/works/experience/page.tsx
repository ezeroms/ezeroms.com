import type { Metadata } from "next";
import { ExperienceChart } from "@/components/ExperienceChart";
import { MobileHeader } from "@/components/MobileHeader";
import { SiteShell } from "@/components/SiteShell";
import { listExperience } from "@/lib/content/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Experience",
  description:
    "いつ・どこで・何に関わったか。職歴と関与の年表です。",
};

export default async function ExperiencePage() {
  const items = await listExperience().catch(() => []);

  return (
    <SiteShell
      bodyClassName="is-works-experience"
      mobileHeader={<MobileHeader title="Experience" />}
      mainClassName="layout-main--single"
      showTagsAside={false}
    >
      <ExperienceChart items={items} />
    </SiteShell>
  );
}
