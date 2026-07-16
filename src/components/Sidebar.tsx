import Link from "next/link";
import {
  Aperture,
  BookOpen,
  Bookmark,
  Briefcase,
  FileText,
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

type Props = {
  pathname: string;
  diaryLatestHref?: string;
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

export function Sidebar({ pathname, diaryLatestHref = "/diary/" }: Props) {
  const isDiary =
    pathname.startsWith("/diary") ||
    pathname.startsWith("/diary_month") ||
    pathname.startsWith("/diary_tag") ||
    pathname.startsWith("/diary_place");
  const isColumn =
    pathname.startsWith("/column") || pathname.startsWith("/column_");
  const isCreative =
    pathname.startsWith("/works/creative") ||
    pathname.startsWith("/work/") ||
    pathname.startsWith("/work_");
  const isExperience = pathname.startsWith("/works/experience");
  const isChooning = pathname.startsWith("/works/chooning");
  const isMe =
    pathname.startsWith("/about/me") || pathname.startsWith("/about/profile");
  const isHere =
    pathname.startsWith("/about/here") || pathname.startsWith("/about/site");
  const isMediaCoverage = pathname.startsWith("/about/media-coverage");
  const isContact = pathname.startsWith("/about/contact");
  const isSmile = pathname.startsWith("/smile");
  const isJumpai = pathname.startsWith("/jumpai");
  const isClips = pathname.startsWith("/clips");
  const isGiants = pathname.startsWith("/shoulders-of-giants");
  const isChronicle = pathname.startsWith("/chronicle");

  const sections: NavSection[] = [
    {
      id: "writing",
      label: "Writing",
      items: [
        {
          href: diaryLatestHref,
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
    {
      id: "photos",
      label: "Photos",
      items: [
        {
          href: "/smile/",
          label: "Smile",
          icon: Smile,
          active: isSmile,
        },
        {
          href: "/jumpai/",
          label: "Jumpai",
          icon: Aperture,
          active: isJumpai,
        },
      ],
    },
    {
      id: "works",
      label: "Works",
      items: [
        {
          href: "/works/creative/",
          label: "Creative",
          icon: Palette,
          active: isCreative,
        },
        {
          href: "/works/experience/",
          label: "Experience",
          icon: Briefcase,
          active: isExperience,
        },
        {
          href: "/works/chooning/",
          label: "Chooning",
          icon: Music2,
          active: isChooning,
        },
      ],
    },
    {
      id: "library",
      label: "Library",
      items: [
        {
          href: "/clips/",
          label: "Clips",
          icon: Bookmark,
          active: isClips,
        },
        {
          href: "/shoulders-of-giants/",
          label: "The shoulders of Giants",
          icon: BookOpen,
          active: isGiants,
        },
        {
          href: "/chronicle/",
          label: "Chronicle",
          icon: Landmark,
          active: isChronicle,
        },
      ],
    },
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
          href: "/about/media-coverage/",
          label: "Media coverage",
          icon: Newspaper,
          active: isMediaCoverage,
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
        className="w-full flex-1 overflow-y-auto px-2 py-3"
        aria-label="グローバルナビゲーション"
      >
        {sections.map((section) => (
          <div key={section.id} className="mb-4 w-full">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
