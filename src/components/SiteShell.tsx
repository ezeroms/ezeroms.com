import { headers } from "next/headers";
import { BodyClass } from "@/components/BodyClass";
import { BreadcrumbHeader } from "@/components/BreadcrumbHeader";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { Sidebar } from "@/components/Sidebar";
import { SiteScripts } from "@/components/SiteScripts";
import { withFilterBreadcrumb } from "@/lib/site/breadcrumb-filters";
import {
  resolveBreadcrumbs,
  type BreadcrumbItem,
} from "@/lib/site/breadcrumbs";
import {
  listPublicPhotoGalleries,
  listPublicWorksSections,
  listPublicLibrarySections,
} from "@/lib/content/queries";
import { cn } from "@/lib/cn";
import { isPhotoGalleryId } from "@/lib/content/photo-galleries";
import {
  ReadingTagsPanel,
  ReadingTagsProvider,
  ReadingTagsToggle,
} from "@/components/ReadingTagsRail";

const READING_CANVAS_BODY_CLASSES = new Set([
  "is-about",
  "is-diary",
  "is-column",
  "is-clips",
  "is-shoulders-of-giants",
  "is-chronicle",
  "is-media-coverage",
  "is-works-creative",
]);

type Props = {
  children: React.ReactNode;
  bodyClassName?: string;
  mainClassName?: string;
  toc?: React.ReactNode;
  /**
   * PC（≥1080）でメインの右に出す Tags レールの中身。
   * 表示するかは `showTagsRail`。スマホ／タブレットでは出さない。
   */
  aside?: React.ReactNode;
  /**
   * 右の Tags レールを出す。aside があっても false なら出さない。
   * 既定は false（一時的に非表示）。Clips / Giants のみ true。
   */
  showTagsRail?: boolean;
  /** Tags レールの初期開閉。Clips / Giants は true。 */
  tagsRailDefaultOpen?: boolean;
  /**
   * 絞り込みパネル。ヘッダー検索モーダル内の「条件」として表示する。
   */
  secondary?: React.ReactNode;
  /** Extra toolbar under the page header (month selector, category tabs, etc.) */
  sectionHeader?: React.ReactNode;
  showLayoutHeader?: boolean;
  /**
   * パンくず末尾のラベル（詳細ページのタイトルなど）。
   * 省略時は pathname から推定した既定値。
   */
  breadcrumbCurrent?: string;
  /**
   * 絞り込み・検索条件の要約（例: 「2024年 · デザイン」）。
   * あるときセクション名のあとに現在地として追加する。
   */
  breadcrumbFilter?: string | null;
  /** breadcrumbFilter 追加時に、セクション名へ付ける一覧 URL */
  breadcrumbSectionHref?: string;
  /**
   * 検索トリガーを条件適用中表示にする。
   * 省略時は breadcrumbFilter があるとき自動で true。
   */
  filterActive?: boolean;
  /** パンくず末尾横の ? 説明（Photo 一覧など）。詳細・絞り込み時は渡さない */
  breadcrumbInfo?: string | null;
  /** パンくず全体を明示指定（pathname 推定を上書き） */
  breadcrumbs?: BreadcrumbItem[];
  /** パンくず＋検索ヘッダーを出さない */
  hidePageHeader?: boolean;
  /** ヘッダー右の検索を隠す */
  hideHeaderSearch?: boolean;
  /**
   * When false, skip mobile chrome entirely (home uses in-page nav).
   * Default true.
   */
  showMobileChrome?: boolean;
  /**
   * メインコンテンツ外周の余白。
   * 省略時はレスポンシブ余白（phone 16 / tablet 20 / desktop 24）。
   * Chronicle など端まで敷きたいページは `p-0` を渡す。
   */
  contentClassName?: string;
  /**
   * `main.layout-main__content` に追加するクラス。
   * Giants の左右独立スクロールなど、メインスクロールを止めて子に委譲するとき用。
   */
  mainContentClassName?: string;
};

export async function SiteShell({
  children,
  bodyClassName = "",
  mainClassName = "layout-main--with-tags",
  toc,
  aside,
  showTagsRail = false,
  tagsRailDefaultOpen = false,
  secondary,
  sectionHeader,
  showLayoutHeader = true,
  breadcrumbCurrent,
  breadcrumbFilter,
  breadcrumbSectionHref,
  filterActive,
  breadcrumbInfo,
  breadcrumbs,
  hidePageHeader = false,
  hideHeaderSearch = false,
  showMobileChrome = true,
  contentClassName,
  mainContentClassName,
}: Props) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const diaryLatestHref = "/diary/";
  const publicPhotos = await listPublicPhotoGalleries().catch(() => []);
  const photoNav = publicPhotos.map((g) => ({
    id: g.id,
    href: g.basePath,
    label: g.label,
  }));
  const publicWorks = await listPublicWorksSections().catch(() => []);
  const worksNav = publicWorks.map((s) => ({
    id: s.id,
    href: s.basePath,
    label: s.label,
  }));
  const publicLibrary = await listPublicLibrarySections().catch(() => []);
  const libraryNav = publicLibrary.map((s) => ({
    id: s.id,
    href: s.basePath,
    label: s.label,
  }));

  const resolvedMain =
    mainClassName === "layout-main--with-tags"
      ? "layout-main--single"
      : mainClassName;

  const baseCrumbs =
    breadcrumbs ?? resolveBreadcrumbs(pathname, breadcrumbCurrent);
  const resolvedCrumbs =
    breadcrumbFilter && breadcrumbSectionHref
      ? withFilterBreadcrumb(
          baseCrumbs,
          breadcrumbFilter,
          breadcrumbSectionHref,
        )
      : baseCrumbs;
  const showBreadcrumbHeader =
    !hidePageHeader && Boolean(resolvedCrumbs?.length);
  const showSectionHeader = Boolean(showLayoutHeader && sectionHeader);
  const showPageHeader = showBreadcrumbHeader || showSectionHeader;
  const isFilterActive =
    filterActive ?? Boolean(breadcrumbFilter?.trim());

  const paperCanvas =
    READING_CANVAS_BODY_CLASSES.has(bodyClassName) ||
    isPhotoGalleryId(bodyClassName.replace(/^is-/, ""));
  const hasAside = Boolean(aside) && showTagsRail;
  const contentPad =
    contentClassName ??
    (paperCanvas
      ? "px-6 py-4 min-[768px]:px-10 min-[768px]:py-5 min-[1080px]:px-12 min-[1080px]:py-6"
      : "p-4 min-[768px]:p-5 min-[1080px]:p-6");

  const pageHeader = showPageHeader ? (
    <header
      className={cn(
        "z-20 flex h-14 w-full shrink-0 items-center gap-2.5",
        "min-[1080px]:h-11",
        "border-0 border-b border-solid border-border bg-background",
        "px-4 min-[768px]:px-5 min-[1080px]:px-6",
        hasAside ? "relative" : "sticky top-0",
      )}
    >
      {showMobileChrome ? <MobileMenuButton /> : null}
      {showBreadcrumbHeader && resolvedCrumbs ? (
        <BreadcrumbHeader
          items={resolvedCrumbs}
          showSearch={!hideHeaderSearch}
          infoDescription={breadcrumbInfo}
          filterPanel={secondary}
          filterActive={isFilterActive}
          beforeSearch={hasAside ? <ReadingTagsToggle /> : null}
          className="min-w-0 flex-1"
        />
      ) : null}
      {showSectionHeader ? (
        <div
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            showBreadcrumbHeader && "ml-2 min-[1080px]:ml-4",
          )}
        >
          {sectionHeader}
        </div>
      ) : null}
    </header>
  ) : null;

  return (
    <>
      <BodyClass className={bodyClassName} />
      <div className="sidebar__overlay" id="sidebar-overlay" />
      <div
        className={cn(
          "layout-container",
          "flex h-screen w-full overflow-hidden bg-background text-foreground",
          paperCanvas && "reading-canvas",
          "max-[1079px]:flex-col",
        )}
      >
        <aside
          className={cn(
            "layout-sidebar",
            "flex h-screen shrink-0 flex-col border-r border-border bg-card",
            "!items-stretch !p-0",
            /* Desktop: in-flow rail — !w-56 beats legacy --sidebar-width (240px) */
            "min-[1080px]:relative min-[1080px]:!w-56 min-[1080px]:translate-x-0",
            /* ≤1079: off-canvas drawer — open via .is-open (see overrides.css) */
            "max-[1079px]:fixed max-[1079px]:inset-y-0 max-[1079px]:left-0 max-[1079px]:z-[1000]",
          )}
          aria-label="グローバルナビゲーション"
        >
          <Sidebar
            pathname={pathname}
            diaryLatestHref={diaryLatestHref}
            photoNav={photoNav}
            worksNav={worksNav}
            libraryNav={libraryNav}
          />
        </aside>

        <div className="layout-body relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <div className="relative flex min-h-0 flex-1 flex-col">
            {hasAside ? (
              <ReadingTagsProvider defaultOpen={tagsRailDefaultOpen}>
                {pageHeader}
                <div
                  className={cn(
                    "layout-main flex min-h-0 min-w-0 flex-1 overflow-hidden",
                    resolvedMain,
                    "!flex !h-full !min-h-0 !flex-col min-[1080px]:!flex-row",
                  )}
                >
                  {toc}
                  <main
                    className={cn(
                      "layout-main__content min-h-0 flex-1 overflow-y-auto font-sans",
                      "!h-full !max-w-none !p-0 min-[1080px]:min-h-0",
                      mainContentClassName,
                    )}
                    id="main-content"
                  >
                    <div className={cn("w-full", contentPad)}>
                      {children}
                    </div>
                  </main>
                  <ReadingTagsPanel>{aside}</ReadingTagsPanel>
                </div>
              </ReadingTagsProvider>
            ) : (
              <>
                <div
                  className={cn(
                    "layout-main flex min-h-0 min-w-0 flex-1 overflow-hidden",
                    resolvedMain,
                    "!flex !h-full !min-h-0 !flex-col",
                  )}
                >
                  {toc}
                  <main
                    className={cn(
                      "layout-main__content min-h-0 flex-1 overflow-y-auto font-sans",
                      "!h-full !max-w-none !p-0",
                      mainContentClassName,
                    )}
                    id="main-content"
                  >
                    {pageHeader}
                    <div className={cn("w-full", contentPad)}>
                      {children}
                    </div>
                  </main>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <SiteScripts />
    </>
  );
}
