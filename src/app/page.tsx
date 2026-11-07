import { HomePortal } from "@/components/HomePortal";
import { SiteShell } from "@/components/SiteShell";
import { loadHomePortal } from "@/lib/content/home-portal";

export const revalidate = 60;

export default async function HomePage() {
  const portal = await loadHomePortal();

  return (
    <SiteShell
      bodyClassName="is-home"
      /* Avoid layout-main--centered: its justify-content:center clips tall content */
      mainClassName="layout-main--single"
      showLayoutHeader={false}
      showMobileChrome={false}
      contentClassName="p-0"
    >
      <HomePortal data={portal} />
    </SiteShell>
  );
}
