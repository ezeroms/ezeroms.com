import { headers } from "next/headers";
import { BodyClass } from "@/components/BodyClass";
import { BreadcrumbHeader } from "@/components/BreadcrumbHeader";
import { FilterRail } from "@/components/FilterRail";
import { Sidebar } from "@/components/Sidebar";
import { SiteScripts } from "@/components/SiteScripts";
import { withFilterBreadcrumb } from "@/lib/site/breadcrumb-filters";
import {
  resolveBreadcrumbs,
  type BreadcrumbItem,
} from "@/lib/site/breadcrumbs";
import { listPublicPhotoGalleries } from "@/lib/content/queries";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  bodyClassName?: string;
  mainClassName?: string;
  toc?: React.ReactNode;
  secondary?: React.ReactNode;
  /** Extra toolbar under the page header (month selector, category tabs, etc.) */
  sectionHeader?: React.ReactNode;
  mobileHeader?: React.ReactNode;
  showTagsAside?: boolean;
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
   * 右下フィルター FAB をアクティブ表示にする。
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
};

export async function SiteShell({
  children,
  bodyClassName = "",
  mainClassName = "layout-main--with-tags",
  toc,
  secondary,
  sectionHeader,
  mobileHeader,
  showTagsAside = true,
  showLayoutHeader = true,
  breadcrumbCurrent,
  breadcrumbFilter,
  breadcrumbSectionHref,
  filterActive,
  breadcrumbInfo,
  breadcrumbs,
  hidePageHeader = false,
  hideHeaderSearch = false,
}: Props) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const notesLatestHref = "/diary/";
  const publicPhotos = await listPublicPhotoGalleries().catch(() => []);
  const photoNav = publicPhotos.map((g) => ({
    id: g.id,
    href: g.basePath,
    label: g.label,
  }));

  const showAside = Boolean(showTagsAside && secondary);
  const resolvedMain =
    mainClassName === "layout-main--with-tags" && !showAside
      ? "layout-main--single"
      : showAside
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

  return (
    <>
      <BodyClass className={bodyClassName} />
      <div className="sidebar__overlay" id="sidebar-overlay" />
      <div
        className={cn(
          "layout-container",
          "flex h-screen w-full overflow-hidden bg-background text-foreground",
        )}
      >
        <aside
          className={cn(
            "layout-sidebar",
            "!w-56 !items-stretch !p-0 flex h-screen shrink-0 flex-col border-r border-border bg-card",
          )}
          aria-label="グローバルナビゲーション"
        >
          <Sidebar
            pathname={pathname}
            notesLatestHref={notesLatestHref}
            photoNav={photoNav}
          />
        </aside>

        <div className="layout-body relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
          {mobileHeader}

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              className={cn(
                "layout-main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
                resolvedMain,
                "!flex !h-full !min-h-0 !flex-col",
              )}
            >
              {toc}
              <main
                className={cn(
                  "layout-main__content min-h-0 flex-1 overflow-y-auto font-sans",
                  "!h-full !max-w-none !p-0",
                )}
                id="main-content"
              >
                {/* sticky: 初期は通常フローで見える。スクロール時に下の投稿がヘッダー下へ隠れる */}
                {showPageHeader ? (
                  <header
                    className={cn(
                      "sticky top-0 z-20 flex h-11 w-full shrink-0 items-center",
                      "border-0 border-b border-solid border-border bg-background",
                      "px-6",
                    )}
                  >
                    {showBreadcrumbHeader && resolvedCrumbs ? (
                      <BreadcrumbHeader
                        items={resolvedCrumbs}
                        showSearch={!hideHeaderSearch}
                        infoDescription={breadcrumbInfo}
                        className="min-w-0 flex-1"
                      />
                    ) : null}
                    {showSectionHeader ? (
                      <div
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm",
                          showBreadcrumbHeader && "ml-4",
                        )}
                      >
                        {sectionHeader}
                      </div>
                    ) : null}
                  </header>
                ) : null}

                <div className="w-full px-6 py-8">{children}</div>
              </main>
            </div>

            {showAside ? (
              <FilterRail active={isFilterActive}>{secondary}</FilterRail>
            ) : null}
          </div>
        </div>
      </div>
      <SiteScripts />
    </>
  );
}
