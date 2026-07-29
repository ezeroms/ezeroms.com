/**
 * ヘッダー検索のスコープ（いま開いているセクション内だけを探す）。
 * 公開 URL は `/diary/search/?q=` のようにセクション配下に置く（scope クエリは使わない）。
 */

export type SearchScopeId =
  | "notes"
  | "column"
  | "smile"
  | "jumpai"
  | "tabekake"
  | "creative"
  | "experience"
  | "chooning"
  | "clips"
  | "giants"
  | "chronicle"
  | "media-coverage"
  | "about-me"
  | "about-here"
  | "about-contact"
  | "all";

export type SearchScope = {
  id: SearchScopeId;
  /** UI 表示名（モーダル・結果ページ） */
  label: string;
};

const SCOPE_LABELS: Record<SearchScopeId, string> = {
  notes: "Notes",
  column: "Column",
  smile: "Smile",
  jumpai: "Jampai",
  tabekake: "Tabekake",
  creative: "Creative",
  experience: "Experience",
  chooning: "Chooning",
  clips: "Clips",
  giants: "The shoulders of Giants",
  chronicle: "Chronicle",
  "media-coverage": "Media coverage",
  "about-me": "Me",
  "about-here": "Here",
  "about-contact": "Contact",
  all: "All",
};

/** スコープごとの検索ページ URL（trailing slash 付き） */
export const SEARCH_PATH_BY_SCOPE: Record<SearchScopeId, string> = {
  all: "/search/",
  notes: "/diary/search/",
  column: "/column/search/",
  smile: "/smile/search/",
  jumpai: "/jumpai/search/",
  tabekake: "/tabekake/search/",
  creative: "/works/creative/search/",
  experience: "/works/experience/search/",
  chooning: "/works/chooning/search/",
  clips: "/clips/search/",
  giants: "/shoulders-of-giants/search/",
  chronicle: "/chronicle/search/",
  "media-coverage": "/about/media-coverage/search/",
  "about-me": "/about/me/search/",
  "about-here": "/about/here/search/",
  "about-contact": "/about/contact/search/",
};

/** スコープの一覧トップ（パンくず用） */
export const SECTION_INDEX_BY_SCOPE: Record<SearchScopeId, string> = {
  all: "/",
  notes: "/diary/",
  column: "/column/",
  smile: "/smile/",
  jumpai: "/jumpai/",
  tabekake: "/tabekake/",
  creative: "/works/creative/",
  experience: "/works/experience/",
  chooning: "/works/chooning/",
  clips: "/clips/",
  giants: "/shoulders-of-giants/",
  chronicle: "/chronicle/",
  "media-coverage": "/about/media-coverage/",
  "about-me": "/about/me/",
  "about-here": "/about/here/",
  "about-contact": "/about/contact/",
};

const VALID_SCOPES = new Set<string>(Object.keys(SCOPE_LABELS));

export function isSearchScopeId(value: string): value is SearchScopeId {
  return VALID_SCOPES.has(value);
}

export function getSearchScope(id: SearchScopeId): SearchScope {
  return { id, label: SCOPE_LABELS[id] };
}

export function searchPathForScope(scope: SearchScopeId): string {
  return SEARCH_PATH_BY_SCOPE[scope];
}

/** `/diary/search/?q=foo` 形式の href を返す（scope クエリは付けない）。 */
export function buildSearchHref(scope: SearchScopeId, q?: string): string {
  const base = searchPathForScope(scope);
  const trimmed = (q ?? "").trim();
  if (!trimmed) return base;
  return `${base}?q=${encodeURIComponent(trimmed)}`;
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

/** pathname がセクション検索ページか（サイト全体 `/search/` 含む）。 */
export function isSearchPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === "/search/" || path.endsWith("/search/");
}

/** pathname から検索スコープを推定する。 */
export function resolveSearchScope(pathname: string): SearchScope {
  const path = normalizePath(pathname);

  if (
    path.startsWith("/diary/") ||
    path.startsWith("/diary_month/") ||
    path.startsWith("/diary_tag/") ||
    path.startsWith("/diary_place/")
  ) {
    return getSearchScope("notes");
  }
  if (path.startsWith("/column/") || path.startsWith("/column_")) {
    return getSearchScope("column");
  }
  if (path.startsWith("/smile/")) return getSearchScope("smile");
  if (path.startsWith("/jumpai/")) return getSearchScope("jumpai");
  if (path.startsWith("/tabekake/")) return getSearchScope("tabekake");
  if (path.startsWith("/works/creative/") || path.startsWith("/work/")) {
    return getSearchScope("creative");
  }
  if (path.startsWith("/works/experience/")) {
    return getSearchScope("experience");
  }
  if (path.startsWith("/works/chooning/")) {
    return getSearchScope("chooning");
  }
  if (path.startsWith("/clips/")) return getSearchScope("clips");
  if (path.startsWith("/shoulders-of-giants/")) {
    return getSearchScope("giants");
  }
  if (path.startsWith("/chronicle/")) return getSearchScope("chronicle");
  if (path.startsWith("/about/media-coverage/")) {
    return getSearchScope("media-coverage");
  }
  if (path.startsWith("/about/me/") || path.startsWith("/about/profile/")) {
    return getSearchScope("about-me");
  }
  if (path.startsWith("/about/here/") || path.startsWith("/about/site/")) {
    return getSearchScope("about-here");
  }
  if (path.startsWith("/about/contact/")) {
    return getSearchScope("about-contact");
  }

  return getSearchScope("all");
}
