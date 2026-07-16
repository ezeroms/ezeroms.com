import { SiteShell } from "@/components/SiteShell";
import { MobileHeader } from "@/components/MobileHeader";
import { cn } from "@/lib/cn";

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
  wide = false,
}: {
  pathname: string;
  children: React.ReactNode;
  /** Full content width (card grids). Default is reading column. */
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
    >
      <div
        className={cn(
          "font-sans text-foreground",
          wide ? "w-full" : "mx-auto max-w-3xl",
        )}
      >
        {children}
      </div>
    </SiteShell>
  );
}
