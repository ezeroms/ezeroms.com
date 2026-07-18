import { SiteShell } from "@/components/SiteShell";
import { MobileHeader } from "@/components/MobileHeader";

const PAGE_TITLES: Record<string, string> = {
  "/about/me/": "Me",
  "/about/here/": "Here",
  "/about/media-coverage/": "Media coverage",
  "/about/contact/": "Contact",
};

/** About page chrome — same shell / column layout as other sections. */
export function AboutShell({
  pathname,
  children,
}: {
  pathname: string;
  children: React.ReactNode;
  /** Full content width (card grids). Kept for callers; card itself constrains width. */
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
