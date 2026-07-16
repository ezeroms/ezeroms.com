export type SitePageMeta = {
  title: string;
  description?: string;
};

const NOTES: SitePageMeta = {
  title: "Notes",
  description: "日常の短いメモとスナップ。気づきや記録を残す場所です。",
};

const CLIPS: SitePageMeta = {
  title: "Clips",
  description: "Webのニュースや記事のクリップ。出典と短いメモだけを残す場所です。",
};

const COLUMN: SitePageMeta = {
  title: "Column",
  description:
    "長めの記事。技術・考察・エッセイなど、きちんと書き切る場所です。",
};

const CREATIVE: SitePageMeta = {
  title: "Creative",
  description: "つくったもの・サイトのギャラリー。制作実績を並べて眺める場所です。",
};

const EXPERIENCE: SitePageMeta = {
  title: "Experience",
  description:
    "いつ・どこで・何に関わったか。職歴と関与の年表です。棒をクリックすると役割やプロジェクトが表示されます。",
};

const CHOONING: SitePageMeta = {
  title: "Chooning",
  description:
    "音楽への思いを記録するプロダクト Chooning。特筆して残したい作品です。",
};

const ABOUT: SitePageMeta = {
  title: "About",
  description: "プロフィールとサイトについて。",
};

const ABOUT_ME: SitePageMeta = {
  title: "Me",
  description: "プロフィール。",
};

const ABOUT_HERE: SitePageMeta = {
  title: "Here",
  description: "このサイトについて。",
};

const ABOUT_MEDIA: SitePageMeta = {
  title: "Media coverage",
  description: "メディア掲載。",
};

const ABOUT_CONTACT: SitePageMeta = {
  title: "Contact",
  description: "お問い合わせ。",
};

const GIANTS: SitePageMeta = {
  title: "The shoulders of Giants",
  description: "影響を受けた人・作品・考え方のメモ。",
};

const CHRONICLE: SitePageMeta = {
  title: "Chronicle",
  description:
    "関心ごとの年表。社会・技術・自分の関心を、年とタグで横断して辿ります。",
};

const SMILE: SitePageMeta = {
  title: "Smile",
  description:
    "作品として見せたい写真のギャラリー。Smile に収めた一枚です。",
};

const JUMPAI: SitePageMeta = {
  title: "Jumpai",
  description:
    "作品として見せたい写真のギャラリー。Jumpai に収めた一枚です。",
};

const SEARCH: SitePageMeta = {
  title: "Search",
  description: "サイト内検索。",
};

/** Section-level page chrome. Returns null for home / detail posts. */
export function resolveSitePageMeta(pathname: string): SitePageMeta | null {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;

  if (path === "/") return null;

  if (
    path.startsWith("/diary/") ||
    path.startsWith("/diary_month/") ||
    path.startsWith("/diary_tag/") ||
    path.startsWith("/diary_place/")
  ) {
    // Permalink detail still shows Notes chrome (timeline context)
    return NOTES;
  }

  if (path.startsWith("/clips/")) return CLIPS;

  if (/^\/column\/[^/]+\/$/.test(path)) return null;
  if (path.startsWith("/column/") || path.startsWith("/column_")) return COLUMN;

  if (/^\/works\/creative\/[^/]+\/$/.test(path)) return null;
  if (path.startsWith("/works/creative/")) return CREATIVE;
  if (path.startsWith("/works/experience/")) return EXPERIENCE;
  if (path.startsWith("/works/chooning/")) return CHOONING;
  if (path.startsWith("/work/") || path.startsWith("/work_")) return CREATIVE;

  if (path.startsWith("/about/me/") || path.startsWith("/about/profile/")) {
    return ABOUT_ME;
  }
  if (path.startsWith("/about/here/") || path.startsWith("/about/site/")) {
    return ABOUT_HERE;
  }
  if (path.startsWith("/about/media-coverage/")) return ABOUT_MEDIA;
  if (path.startsWith("/about/contact/")) return ABOUT_CONTACT;
  if (path.startsWith("/about/")) return ABOUT;

  if (/^\/shoulders-of-giants\/[^/]+\/$/.test(path)) return null;
  if (path.startsWith("/shoulders-of-giants/")) return GIANTS;

  if (/^\/chronicle\/[^/]+\/$/.test(path)) return null;
  if (path.startsWith("/chronicle/")) return CHRONICLE;

  if (/^\/smile\/[^/]+\/$/.test(path)) return null;
  if (path.startsWith("/smile/")) return SMILE;

  if (/^\/jumpai\/[^/]+\/$/.test(path)) return null;
  if (path.startsWith("/jumpai/")) return JUMPAI;

  if (path.startsWith("/search/")) return SEARCH;

  return null;
}
