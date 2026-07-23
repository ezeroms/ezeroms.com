import { SiteShell } from "@/components/SiteShell";
import { MobileHeader } from "@/components/MobileHeader";

const PAGE_TITLES: Record<string, string> = {
  "/about/me/": "Me",
  "/about/here/": "Here",
  "/about/media-coverage/": "Media coverage",
  "/about/contact/": "Contact",
};

/**
 * About 配下ページ共通のシェル（パンくず・サイドバー付き SiteShell）。
 */
export function AboutShell({
  pathname,
  children,
}: {
  pathname: string;
  children: React.ReactNode;
  /**
   * 以前はカードグリッド用の幅指定だった。
   * 現状 SiteShell 側で幅を制御するため未使用（呼び出し互換のため残す）。
   */
  wide?: boolean;
}) {
  const title =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/about/media-coverage")
      ? "Media coverage"
      : "About");

  return (
    <SiteShell
      bodyClassName="is-about"
      mobileHeader={<MobileHeader title={title} />}
      showTagsAside={false}
      showLayoutHeader={false}
      mainClassName="layout-main--single"
    >
      <div className="w-full font-sans text-foreground">{children}</div>
    </SiteShell>
  );
}
