export type AdminNavStatus = "ready" | "soon";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  status: AdminNavStatus;
  /** lucide icon name key */
  icon:
    | "layout-dashboard"
    | "notebook-pen"
    | "bookmark"
    | "file-text"
    | "briefcase"
    | "palette"
    | "music-2"
    | "smile"
    | "aperture"
    | "pizza"
    | "image"
    | "book-open"
    | "landmark"
    | "user"
    | "home"
    | "newspaper";
};

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        href: "/admin/",
        label: "ダッシュボード",
        description: "全体の入口",
        status: "ready",
        icon: "layout-dashboard",
      },
    ],
  },
  {
    id: "writing",
    label: "Writing",
    items: [
      {
        href: "/admin/notes/",
        label: "Notes",
        description: "日記・メモのタイムライン",
        status: "ready",
        icon: "notebook-pen",
      },
      {
        href: "/admin/column/",
        label: "Column",
        description: "長めのエッセイ・記事",
        status: "ready",
        icon: "file-text",
      },
    ],
  },
  {
    id: "photos",
    label: "Photos",
    items: [
      {
        href: "/admin/smile/",
        label: "Smile",
        description: "写真ギャラリー Smile",
        status: "ready",
        icon: "smile",
      },
      {
        href: "/admin/jumpai/",
        label: "Jampai",
        description: "写真ギャラリー Jampai",
        status: "ready",
        icon: "aperture",
      },
      {
        href: "/admin/kuikake/",
        label: "Kuikake",
        description: "写真ギャラリー Kuikake",
        status: "ready",
        icon: "pizza",
      },
      {
        href: "/admin/top-images/",
        label: "Top images",
        description: "トップのランダム画像",
        status: "ready",
        icon: "image",
      },
    ],
  },
  {
    id: "works",
    label: "Works",
    items: [
      {
        href: "/admin/creative/",
        label: "Creative",
        description: "つくったもの・制作実績",
        status: "ready",
        icon: "palette",
      },
      {
        href: "/admin/experience/",
        label: "Experience",
        description: "職歴・関与の年表",
        status: "ready",
        icon: "briefcase",
      },
      {
        href: "/admin/chooning/",
        label: "Chooning",
        description: "プロダクト Chooning",
        status: "ready",
        icon: "music-2",
      },
    ],
  },
  {
    id: "library",
    label: "Library",
    items: [
      {
        href: "/admin/clips/",
        label: "Clips",
        description: "Web記事のクリップ・短いメモ",
        status: "ready",
        icon: "bookmark",
      },
      {
        href: "/admin/giants/",
        label: "The shoulders of Giants",
        description: "引用・巨人の肩の上",
        status: "ready",
        icon: "book-open",
      },
      {
        href: "/admin/chronicle/",
        label: "Chronicle",
        description: "年表・出来事",
        status: "ready",
        icon: "landmark",
      },
      {
        href: "/admin/media-coverage/",
        label: "Media coverage",
        description: "掲載・取材",
        status: "ready",
        icon: "newspaper",
      },
    ],
  },
  {
    id: "about",
    label: "About",
    items: [
      {
        href: "/admin/me/",
        label: "Me",
        description: "プロフィール",
        status: "ready",
        icon: "user",
      },
      {
        href: "/admin/here/",
        label: "Here",
        description: "このサイトについて",
        status: "ready",
        icon: "home",
      },
    ],
  },
];

export function flattenAdminNav(): AdminNavItem[] {
  return adminNavSections.flatMap((s) => s.items);
}

export function findAdminNavItem(pathname: string): AdminNavItem | undefined {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return flattenAdminNav().find((item) => {
    if (item.href === "/admin/") {
      return normalized === "/admin/";
    }
    return normalized === item.href || normalized.startsWith(item.href);
  });
}
