import { headers } from "next/headers";
import { BodyClass } from "@/components/BodyClass";
import { FilterRail } from "@/components/FilterRail";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { SiteScripts } from "@/components/SiteScripts";
import { resolveSitePageMeta } from "@/lib/site/page-meta";
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
  /** Override auto-resolved section title */
  pageTitle?: string;
  pageDescription?: string;
  /** Hide the shared section header entirely */
  hidePageHeader?: boolean;
  pageHeaderActions?: React.ReactNode;
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
  pageTitle,
  pageDescription,
  hidePageHeader = false,
  pageHeaderActions,
}: Props) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const diaryLatestHref = "/diary/";

  const showAside = Boolean(showTagsAside && secondary);
  const resolvedMain =
    mainClassName === "layout-main--with-tags" && !showAside
      ? "layout-main--single"
      : showAside
        ? "layout-main--single"
        : mainClassName;

  const auto = resolveSitePageMeta(pathname);
  const title = pageTitle ?? auto?.title;
  const description = pageDescription ?? auto?.description;
  const showPageHeader = !hidePageHeader && Boolean(title);

  const scrollHeader = (
    <>
      {showPageHeader && title ? (
        <div className="mb-6 w-full">
          <PageHeader
            title={title}
            description={description}
            actions={pageHeaderActions}
          />
        </div>
      ) : null}
      {showLayoutHeader && sectionHeader ? (
        <div className="layout-header mb-6 w-full shrink-0 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          {sectionHeader}
        </div>
      ) : null}
    </>
  );

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
          <Sidebar pathname={pathname} diaryLatestHref={diaryLatestHref} />
        </aside>

        <div className="layout-body flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {mobileHeader}

          <div
            className={cn(
              "flex min-h-0 flex-1 px-6 py-6",
              showAside ? "gap-6" : "flex-col",
            )}
          >
            <div
              className={cn(
                "layout-main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
                resolvedMain,
                "!block !h-full !min-h-0",
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
                {scrollHeader}
                <div className="w-full">{children}</div>
              </main>
            </div>

            {showAside ? <FilterRail>{secondary}</FilterRail> : null}
          </div>
        </div>
      </div>
      <SiteScripts />
    </>
  );
}
