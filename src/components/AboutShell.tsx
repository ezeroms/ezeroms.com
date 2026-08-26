import { SiteShell } from "@/components/SiteShell";

/**
 * About 配下ページ共通のシェル（パンくず・サイドバー付き SiteShell）。
 */
export function AboutShell({
  children,
  bodyClassName = "is-about",
}: {
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <SiteShell
      bodyClassName={bodyClassName}
      showLayoutHeader={false}
      mainClassName="layout-main--single"
    >
      <div className="w-full font-sans text-foreground">{children}</div>
    </SiteShell>
  );
}
