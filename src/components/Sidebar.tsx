import Link from "next/link";
import {
  Bird,
  BookOpen,
  Bookmark,
  Briefcase,
  FileText,
  Pizza,
  House,
  Landmark,
  Mail,
  Music2,
  Newspaper,
  NotebookPen,
  Palette,
  Smile,
  User,
  type LucideIcon,
} from "lucide-react";
import { sidebarNavItemClass } from "@/lib/site/nav-styles";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import type { WorksSectionId } from "@/lib/content/works-sections";
import type { LibrarySectionId } from "@/lib/content/library-sections";

export type SidebarPhotoNavItem = {
  id: PhotoGalleryId;
  href: string;
  label: string;
};

export type SidebarWorksNavItem = {
  id: WorksSectionId;
  href: string;
  label: string;
};

export type SidebarLibraryNavItem = {
  id: LibrarySectionId;
  href: string;
  label: string;
};

type Props = {
  pathname: string;
  notesLatestHref?: string;
  /** 公開中の Photos ナビ（非公開は含めない） */
  photoNav?: SidebarPhotoNavItem[];
  /** 公開中の Works ナビ（非公開は含めない） */
  worksNav?: SidebarWorksNavItem[];
  /** 公開中の Library ナビ（非公開は含めない） */
  libraryNav?: SidebarLibraryNavItem[];
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const PHOTO_ICONS: Record<PhotoGalleryId, LucideIcon> = {
  smile: Smile,
  jumpai: Bird,
  kuikake: Pizza,
};

const WORKS_ICONS: Record<WorksSectionId, LucideIcon> = {
  creative: Palette,
  experience: Briefcase,
  chooning: Music2,
};

const WORKS_ACTIVE: Record<
  WorksSectionId,
  (pathname: string) => boolean
> = {
  creative: (pathname) =>
    pathname.startsWith("/works/creative") ||
    pathname.startsWith("/work/") ||
    pathname.startsWith("/work_"),
  experience: (pathname) => pathname.startsWith("/works/experience"),
  chooning: (pathname) => pathname.startsWith("/works/chooning"),
};

const LIBRARY_ICONS: Record<LibrarySectionId, LucideIcon> = {
  clips: Bookmark,
  giants: BookOpen,
  chronicle: Landmark,
  "media-coverage": Newspaper,
};

const LIBRARY_ACTIVE: Record<
  LibrarySectionId,
  (pathname: string) => boolean
> = {
  clips: (pathname) => pathname.startsWith("/clips"),
  giants: (pathname) => pathname.startsWith("/shoulders-of-giants"),
  chronicle: (pathname) => pathname.startsWith("/chronicle"),
  "media-coverage": (pathname) =>
    pathname === "/about/media-coverage" ||
    pathname.startsWith("/about/media-coverage/"),
};

export function Sidebar({
  pathname,
  notesLatestHref = "/diary/",
  photoNav,
  worksNav,
  libraryNav,
}: Props) {
  const isDiary =
    pathname.startsWith("/diary") ||
    pathname.startsWith("/diary_month") ||
    pathname.startsWith("/diary_tag") ||
    pathname.startsWith("/diary_place");
  const isColumn =
    pathname.startsWith("/column") || pathname.startsWith("/column_");
  const isMe =
    pathname === "/about/me" ||
    pathname.startsWith("/about/me/") ||
    pathname === "/about/profile" ||
    pathname.startsWith("/about/profile/");
  const isHere =
    pathname === "/about/here" ||
    pathname.startsWith("/about/here/") ||
    pathname === "/about/site" ||
    pathname.startsWith("/about/site/");
  const isContact =
    pathname === "/about/contact" ||
    pathname.startsWith("/about/contact/");

  const resolvedPhotoNav: SidebarPhotoNavItem[] = photoNav ?? [
    { id: "smile", href: "/smile/", label: "Smile" },
    { id: "jumpai", href: "/jumpai/", label: "Jampai" },
    { id: "kuikake", href: "/kuikake/", label: "Kuikake" },
  ];

  const resolvedWorksNav: SidebarWorksNavItem[] = worksNav ?? [
    { id: "creative", href: "/works/creative/", label: "Creative" },
    { id: "experience", href: "/works/experience/", label: "Experience" },
    { id: "chooning", href: "/works/chooning/", label: "Chooning" },
  ];

  const resolvedLibraryNav: SidebarLibraryNavItem[] = libraryNav ?? [
    { id: "clips", href: "/clips/", label: "Clips" },
    {
      id: "giants",
      href: "/shoulders-of-giants/",
      label: "The shoulders of Giants",
    },
    { id: "chronicle", href: "/chronicle/", label: "Chronicle" },
    {
      id: "media-coverage",
      href: "/about/media-coverage/",
      label: "Media coverage",
    },
  ];

  const photoItems: NavItem[] = resolvedPhotoNav.map((item) => ({
    href: item.href,
    label: item.label,
    icon: PHOTO_ICONS[item.id],
    active: pathname.startsWith(item.href.replace(/\/$/, "")),
  }));

  const worksItems: NavItem[] = resolvedWorksNav.map((item) => ({
    href: item.href,
    label: item.label,
    icon: WORKS_ICONS[item.id],
    active: WORKS_ACTIVE[item.id](pathname),
  }));

  const libraryItems: NavItem[] = resolvedLibraryNav.map((item) => ({
    href: item.href,
    label: item.label,
    icon: LIBRARY_ICONS[item.id],
    active: LIBRARY_ACTIVE[item.id](pathname),
  }));

  const sections: NavSection[] = [
    {
      id: "writing",
      label: "Writing",
      items: [
        {
          href: notesLatestHref,
          label: "Notes",
          icon: NotebookPen,
          active: isDiary,
        },
        {
          href: "/column/",
          label: "Column",
          icon: FileText,
          active: isColumn,
        },
      ],
    },
    ...(photoItems.length
      ? [
          {
            id: "photos",
            label: "Photos",
            items: photoItems,
          } satisfies NavSection,
        ]
      : []),
    ...(worksItems.length
      ? [
          {
            id: "works",
            label: "Works",
            items: worksItems,
          } satisfies NavSection,
        ]
      : []),
    ...(libraryItems.length
      ? [
          {
            id: "library",
            label: "Library",
            items: libraryItems,
          } satisfies NavSection,
        ]
      : []),
    {
      id: "about",
      label: "About",
      items: [
        {
          href: "/about/me/",
          label: "Me",
          icon: User,
          active: isMe,
        },
        {
          href: "/about/here/",
          label: "Here",
          icon: House,
          active: isHere,
        },
        {
          href: "/about/contact/",
          label: "Contact",
          icon: Mail,
          active: isContact,
        },
      ],
    },
  ];

  return (
    <div className="sidebar !items-stretch flex h-full min-h-0 w-full flex-col">
      <button
        className="sidebar__minimize-btn sr-only"
        id="sidebar-minimize-btn"
        type="button"
        aria-label="サイドバーを最小化"
        data-tooltip="メニューを非表示にする"
        tabIndex={-1}
      />

      <div className="w-full shrink-0 border-b border-border px-4 pb-4 pt-6">
        <Link
          href="/"
          className="block opacity-100 transition-opacity hover:opacity-60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/common/logo.svg"
            alt="ezeroms.com"
            className="block h-auto w-[132px] max-w-full"
          />
        </Link>
      </div>

      <nav
        className="w-full flex-1 overflow-y-auto px-2.5 py-4"
        aria-label="グローバルナビゲーション"
      >
        {sections.map((section) => (
          <div key={section.id} className="mb-5 w-full last:mb-0">
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <ul className="m-0 flex w-full list-none flex-col gap-0.5 p-0">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href} className="w-full">
                    <Link
                      href={item.href}
                      className={sidebarNavItemClass(item.active)}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
