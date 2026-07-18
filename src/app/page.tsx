import { SiteShell } from "@/components/SiteShell";
import { HomeRandomImage } from "@/components/HomeRandomImage";
import { listPublicPhotoGalleries } from "@/lib/content/queries";

export const revalidate = 60;

export default async function HomePage() {
  const publicPhotos = await listPublicPhotoGalleries().catch(() => []);
  const photoNav = publicPhotos.map((g) => ({
    href: g.basePath,
    label: g.label,
  }));

  return (
    <SiteShell
      bodyClassName="is-home"
      mainClassName="layout-main--centered"
      showTagsAside={false}
      showLayoutHeader={false}
    >
      <HomeRandomImage notesHref="/diary/" photoNav={photoNav} />
    </SiteShell>
  );
}
