import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { IdGenTool } from "@/components/tools/IdGenTool";

export const metadata: Metadata = {
  title: "Personal Information Generator",
  robots: { index: false, follow: false },
};

export default function IdGenPage() {
  return (
    <SiteShell
      bodyClassName="is-id-gen"
      hidePageHeader
      showMobileChrome={false}
      contentClassName="p-0"
    >
      <IdGenTool />
    </SiteShell>
  );
}
