import { SiteShell } from "@/components/SiteShell";

/**
 * About 配下ページ共通のシェル（パンくず・サイドバー付き SiteShell）。
 */
export function AboutShell({
  children,
}: {
  /** Kept for call-site compatibility; breadcrumbs resolve from SiteShell pathname. */
  pathname: string;
  children: React.ReactNode;
  /**
   * 以前はカードグリッド用の幅指定だった。
   * 現状 SiteShell 側で幅を制御するため未使用（呼び出し互換のため残す）。
   */
  wide?: boolean;
}) {
  return (
    <SiteShell
      bodyClassName="is-about"
      showTagsAside={false}
      showLayoutHeader={false}
      mainClassName="layout-main--single"
    >
      <div className="w-full font-sans text-foreground">{children}</div>
    </SiteShell>
  );
}
