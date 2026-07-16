import { SiteShell } from "@/components/SiteShell";
import { HomeRandomImage } from "@/components/HomeRandomImage";

export const revalidate = 60;

export default async function HomePage() {
  return (
    <SiteShell
      bodyClassName="is-home"
      mainClassName="layout-main--centered"
      showTagsAside={false}
      showLayoutHeader={false}
    >
      <HomeRandomImage diaryHref="/diary/" />
    </SiteShell>
  );
}
