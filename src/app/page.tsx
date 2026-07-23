import { SiteShell } from "@/components/SiteShell";
import { HomeRandomImage } from "@/components/HomeRandomImage";
import {
  listPublicLibrarySections,
  listPublicPhotoGalleries,
  listPublicWorksSections,
} from "@/lib/content/queries";

export const revalidate = 60;

export default async function HomePage() {
  const [publicPhotos, publicWorks, publicLibrary] = await Promise.all([
    listPublicPhotoGalleries().catch(() => []),
    listPublicWorksSections().catch(() => []),
    listPublicLibrarySections().catch(() => []),
  ]);
  const photoNav = publicPhotos.map((g) => ({
    href: g.basePath,
    label: g.label,
  }));
  const worksNav = publicWorks.map((s) => ({
    href: s.basePath,
    label: s.label,
  }));
  const libraryNav = publicLibrary.map((s) => ({
    href: s.basePath,
    label: s.label,
  }));

  return (
    <SiteShell
      bodyClassName="is-home"
      mainClassName="layout-main--centered"
      showTagsAside={false}
      showLayoutHeader={false}
    >
      <HomeRandomImage
        notesHref="/diary/"
        photoNav={photoNav}
        worksNav={worksNav}
        libraryNav={libraryNav}
      />
    </SiteShell>
  );
}
