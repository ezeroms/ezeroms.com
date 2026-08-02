/**
 * サイドバーのセクション構造に沿ったパンくず。
 * 見た目は Smile / Jampai 見出しと同系統（小さめ・muted）。
 */

import {
  isSearchPath,
  resolveSearchScope,
  searchPathForScope,
  SECTION_INDEX_BY_SCOPE,
} from "@/lib/content/search-scope";

export type BreadcrumbItem = {
  label: string;
  /** 省略時は現在地（リンクなし）またはセクション見出し */
  href?: string;
};

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function isDetailUnder(base: string, path: string): boolean {
  // /smile/foo/ のように base 直下の1セグメント詳細
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}[^/]+/$`).test(path);
}

function withLinkedCurrent(
  trail: BreadcrumbItem[],
  indexHref: string,
): BreadcrumbItem[] {
  if (!trail.length) return trail;
  return trail.map((item, index) =>
    index === trail.length - 1 && !item.href
      ? { ...item, href: indexHref }
      : item,
  );
}

/**
 * pathname からパンくずを返す。ホームは null。
 * 詳細ページの末尾ラベルは呼び出し側の `currentLabel` で上書きできる。
 */
export function resolveBreadcrumbs(
  pathname: string,
  currentLabel?: string,
): BreadcrumbItem[] | null {
  const path = normalizePath(pathname);
  if (path === "/") return null;

  const withCurrent = (
    trail: BreadcrumbItem[],
    fallbackCurrent: string,
  ): BreadcrumbItem[] => {
    const label = currentLabel?.trim() || fallbackCurrent;
    return [...trail, { label }];
  };

  // セクション検索 / サイト全体検索（詳細スラッグより先に判定）
  if (isSearchPath(path)) {
    if (path === "/search/") {
      if (currentLabel?.trim()) {
        return [
          { label: "Search", href: "/search/" },
          { label: currentLabel.trim() },
        ];
      }
      return [{ label: "Search" }];
    }

    const scope = resolveSearchScope(path);
    const indexHref = SECTION_INDEX_BY_SCOPE[scope.id];
    const sectionTrail = resolveBreadcrumbs(indexHref) ?? [];
    const trail = withLinkedCurrent(sectionTrail, indexHref);
    const searchHref = searchPathForScope(scope.id);

    if (currentLabel?.trim()) {
      return [
        ...trail,
        { label: "Search", href: searchHref },
        { label: currentLabel.trim() },
      ];
    }
    return [...trail, { label: "Search" }];
  }

  // Photos
  if (path.startsWith("/smile/")) {
    if (isDetailUnder("/smile/", path)) {
      return withCurrent(
        [{ label: "Photos" }, { label: "Smile", href: "/smile/" }],
        "Photo",
      );
    }
    return [{ label: "Photos" }, { label: "Smile" }];
  }
  if (path.startsWith("/jumpai/")) {
    if (isDetailUnder("/jumpai/", path)) {
      return withCurrent(
        [{ label: "Photos" }, { label: "Jampai", href: "/jumpai/" }],
        "Photo",
      );
    }
    return [{ label: "Photos" }, { label: "Jampai" }];
  }
  if (path.startsWith("/tabekake/")) {
    if (isDetailUnder("/tabekake/", path)) {
      return withCurrent(
        [{ label: "Photos" }, { label: "Tabekake", href: "/tabekake/" }],
        "Photo",
      );
    }
    return [{ label: "Photos" }, { label: "Tabekake" }];
  }

  // Writing — Notes
  if (
    path.startsWith("/diary/") ||
    path.startsWith("/diary_month/") ||
    path.startsWith("/diary_tag/") ||
    path.startsWith("/diary_place/")
  ) {
    if (path === "/diary/") {
      return [{ label: "Writing" }, { label: "Notes" }];
    }
    return withCurrent(
      [{ label: "Writing" }, { label: "Notes", href: "/diary/" }],
      "Note",
    );
  }

  if (path.startsWith("/column/") || path.startsWith("/column_")) {
    if (isDetailUnder("/column/", path)) {
      return withCurrent(
        [{ label: "Writing" }, { label: "Column", href: "/column/" }],
        "Article",
      );
    }
    return [{ label: "Writing" }, { label: "Column" }];
  }

  // Works
  if (path.startsWith("/works/creative/") || path.startsWith("/work/")) {
    if (
      isDetailUnder("/works/creative/", path) ||
      isDetailUnder("/work/", path)
    ) {
      return withCurrent(
        [{ label: "Works" }, { label: "Creative", href: "/works/creative/" }],
        "Work",
      );
    }
    return [{ label: "Works" }, { label: "Creative" }];
  }
  if (path.startsWith("/works/experience/")) {
    return [{ label: "Works" }, { label: "Experience" }];
  }
  if (path.startsWith("/works/chooning/")) {
    return [{ label: "Works" }, { label: "Chooning" }];
  }

  // Library
  if (path.startsWith("/clips/")) {
    if (isDetailUnder("/clips/", path)) {
      return withCurrent(
        [{ label: "Library" }, { label: "Clips", href: "/clips/" }],
        "Clip",
      );
    }
    return [{ label: "Library" }, { label: "Clips" }];
  }
  if (path.startsWith("/shoulders-of-giants/")) {
    if (isDetailUnder("/shoulders-of-giants/", path)) {
      return withCurrent(
        [
          { label: "Library" },
          {
            label: "The shoulders of Giants",
            href: "/shoulders-of-giants/",
          },
        ],
        "Memo",
      );
    }
    return [
      { label: "Library" },
      { label: "The shoulders of Giants" },
    ];
  }
  if (path.startsWith("/chronicle/")) {
    if (isDetailUnder("/chronicle/", path)) {
      return withCurrent(
        [{ label: "Library" }, { label: "Chronicle", href: "/chronicle/" }],
        "Event",
      );
    }
    return [{ label: "Library" }, { label: "Chronicle" }];
  }

  // About
  if (path.startsWith("/about/me/") || path.startsWith("/about/profile/")) {
    return [{ label: "About" }, { label: "Me" }];
  }
  if (path.startsWith("/about/here/") || path.startsWith("/about/site/")) {
    return [{ label: "About" }, { label: "Here" }];
  }
  if (path.startsWith("/about/media-coverage/")) {
    if (isDetailUnder("/about/media-coverage/", path)) {
      return withCurrent(
        [
          { label: "Library" },
          { label: "Media coverage", href: "/about/media-coverage/" },
        ],
        "Article",
      );
    }
    return [{ label: "Library" }, { label: "Media coverage" }];
  }
  if (path.startsWith("/about/contact/")) {
    return [{ label: "About" }, { label: "Contact" }];
  }
  if (path.startsWith("/about/")) {
    return [{ label: "About" }];
  }

  if (path.startsWith("/ui-design-guidebook/")) {
    return [{ label: "UI Design Guidebook" }];
  }

  return null;
}
