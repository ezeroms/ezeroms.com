export type AdminNavStatus = "ready" | "soon";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  status: AdminNavStatus;
  /** lucide icon name key */
  icon:
    | "layout-dashboard"
    | "calendar"
    | "check-square"
    | "folder"
    | "files"
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
    | "users"
    | "home"
    | "newspaper"
    | "globe"
    | "chart-column"
    | "mail"
    | "tags";
};

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        href: "/admin/workspace/",
        label: "Dashboard",
        description: "今日の予定・Tasks・Docsの入口",
        status: "ready",
        icon: "layout-dashboard",
      },
      {
        href: "/admin/workspace/calendar/",
        label: "Calendar",
        description: "週グリッドで予定を確認",
        status: "ready",
        icon: "calendar",
      },
      {
        href: "/admin/workspace/tasks/",
        label: "Tasks",
        description: "タスクの管理",
        status: "ready",
        icon: "check-square",
      },
      {
        href: "/admin/workspace/projects/",
        label: "Projects",
        description: "Project の名前・状態を管理",
        status: "ready",
        icon: "folder",
      },
      {
        href: "/admin/workspace/docs/",
        label: "Docs",
        description: "非公開メモ・資料",
        status: "ready",
        icon: "files",
      },
      {
        href: "/admin/workspace/contacts/",
        label: "Contacts",
        description: "人・名刺・仕事の連絡先",
        status: "ready",
        icon: "user",
      },
      {
        href: "/admin/workspace/friends/",
        label: "Friends",
        description: "交友録（Friend フラグ）",
        status: "ready",
        icon: "users",
      },
      {
        href: "/admin/workspace/activities/",
        label: "Activities",
        description: "Activity 一覧",
        status: "ready",
        icon: "tags",
      },
    ],
  },
  {
    id: "site",
    label: "Site",
    items: [
      {
        href: "/admin/site/",
        label: "Settings",
        description: "トップの OGP などサイト全体設定",
        status: "ready",
        icon: "globe",
      },
      {
        href: "/admin/analytics/",
        label: "Analytics",
        description: "公開サイトのアクセス状況",
        status: "ready",
        icon: "chart-column",
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
        href: "/admin/tabekake/",
        label: "Tabekake",
        description: "写真ギャラリー Tabekake",
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
      {
        href: "/admin/contact/",
        label: "Contact",
        description: "お問い合わせページ",
        status: "ready",
        icon: "mail",
      },
    ],
  },
];

export function flattenAdminNav(): AdminNavItem[] {
  return adminNavSections.flatMap((s) => s.items);
}

export function findAdminNavItem(pathname: string): AdminNavItem | undefined {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  // Prefer longest matching href so /admin/workspace/calendar/ wins over /admin/workspace/
  const matches = flattenAdminNav().filter(
    (item) =>
      normalized === item.href || normalized.startsWith(item.href),
  );
  if (matches.length === 0) return undefined;
  return matches.sort((a, b) => b.href.length - a.href.length)[0];
}
