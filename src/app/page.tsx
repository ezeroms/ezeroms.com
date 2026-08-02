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
    id: g.id,
    href: g.basePath,
    label: g.label,
  }));
  const worksNav = publicWorks.map((s) => ({
    id: s.id,
    href: s.basePath,
    label: s.label,
  }));
  const libraryNav = publicLibrary.map((s) => ({
    id: s.id,
    href: s.basePath,
    label: s.label,
  }));

  return (
    <SiteShell
      bodyClassName="is-home"
      /* Avoid layout-main--centered: its justify-content:center clips tall content */
      mainClassName="layout-main--single"
      showTagsAside={false}
      showLayoutHeader={false}
      showMobileChrome={false}
      contentClassName="p-0"
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
