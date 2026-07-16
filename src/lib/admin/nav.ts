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
    | "smile"
    | "aperture"
    | "image"
    | "book-open"
    | "landmark"
    | "user"
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
        status: "soon",
        icon: "file-text",
      },
      {
        href: "/admin/work/",
        label: "Works",
        description: "Creative / Experience / Chooning",
        status: "soon",
        icon: "briefcase",
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
        label: "Jumpai",
        description: "写真ギャラリー Jumpai",
        status: "ready",
        icon: "aperture",
      },
      {
        href: "/admin/top-images/",
        label: "Top images",
        description: "トップのランダム画像",
        status: "soon",
        icon: "image",
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
        label: "Giants",
        description: "Shoulders of Giants",
        status: "soon",
        icon: "book-open",
      },
      {
        href: "/admin/chronicle/",
        label: "Chronicle",
        description: "年表・出来事",
        status: "soon",
        icon: "landmark",
      },
    ],
  },
  {
    id: "site",
    label: "Site",
    items: [
      {
        href: "/admin/about/",
        label: "About",
        description: "プロフィール",
        status: "soon",
        icon: "user",
      },
      {
        href: "/admin/media-coverage/",
        label: "Media coverage",
        description: "掲載・取材",
        status: "soon",
        icon: "newspaper",
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
