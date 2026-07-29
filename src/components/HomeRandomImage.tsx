"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bird,
  BookOpen,
  Bookmark,
  Briefcase,
  FileText,
  House,
  Landmark,
  Mail,
  Music2,
  Newspaper,
  NotebookPen,
  Palette,
  Pizza,
  Smile,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import type { WorksSectionId } from "@/lib/content/works-sections";
import type { LibrarySectionId } from "@/lib/content/library-sections";

type TopImagePayload = {
  image_url: string;
  alt: string;
  location: string | null;
  captured_year: number | null;
};

function formatTopCaption(
  location: string | null | undefined,
  year: number | null | undefined,
): string | null {
  const loc = (location ?? "").trim();
  const y =
    typeof year === "number" && Number.isFinite(year) ? String(year) : "";
  if (loc && y) return `${loc}, ${y}`;
  if (loc) return loc;
  if (y) return y;
  return null;
}

export type HomePhotoNavItem = {
  id: PhotoGalleryId;
  href: string;
  label: string;
};

export type HomeWorksNavItem = {
  id: WorksSectionId;
  href: string;
  label: string;
};

export type HomeLibraryNavItem = {
  id: LibrarySectionId;
  href: string;
  label: string;
};

type Props = {
  notesHref: string;
  photoNav?: HomePhotoNavItem[];
  worksNav?: HomeWorksNavItem[];
  libraryNav?: HomeLibraryNavItem[];
};

const PHOTO_ICONS: Record<PhotoGalleryId, LucideIcon> = {
  smile: Smile,
  jumpai: Bird,
  tabekake: Pizza,
};

const WORKS_ICONS: Record<WorksSectionId, LucideIcon> = {
  creative: Palette,
  experience: Briefcase,
  chooning: Music2,
};

const LIBRARY_ICONS: Record<LibrarySectionId, LucideIcon> = {
  clips: Bookmark,
  giants: BookOpen,
  chronicle: Landmark,
  "media-coverage": Newspaper,
};

function HomeNavCard({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        "rounded-lg border border-black/10 bg-white/70 px-2 py-4",
        "text-center text-[#050317] no-underline",
        "transition-opacity hover:opacity-70",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="text-[0.8rem] leading-snug font-medium tracking-wide">
        {label}
      </span>
    </Link>
  );
}

function HomeNavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="grid grid-cols-3 gap-2.5 min-[768px]:gap-3">{children}</div>
    </div>
  );
}

/**
 * Home hero + (≤1079) in-page nav.
 * One DOM tree for all breakpoints — desktop look via min-[1080px] utilities,
 * not a separate markup branch (avoids legacy dual-layout clipping bugs).
 */
export function HomeRandomImage({
  notesHref,
  photoNav = [
    { id: "smile", href: "/smile/", label: "Smile" },
    { id: "jumpai", href: "/jumpai/", label: "Jampai" },
    { id: "tabekake", href: "/tabekake/", label: "Tabekake" },
  ],
  worksNav = [
    { id: "creative", href: "/works/creative/", label: "Creative" },
    { id: "experience", href: "/works/experience/", label: "Experience" },
    { id: "chooning", href: "/works/chooning/", label: "Chooning" },
  ],
  libraryNav = [
    { id: "clips", href: "/clips/", label: "Clips" },
    {
      id: "giants",
      href: "/shoulders-of-giants/",
      label: "The shoulders of Giants",
    },
    { id: "chronicle", href: "/chronicle/", label: "Chronicle" },
    {
      id: "media-coverage",
      href: "/about/media-coverage/",
      label: "Media coverage",
    },
  ],
}: Props) {
  const [image, setImage] = useState<TopImagePayload | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/top-image/", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as TopImagePayload;
        if (!cancelled && data.image_url) {
          setLoaded(false);
          setImage({
            image_url: `${data.image_url}${data.image_url.includes("?") ? "&" : "?"}t=${Date.now()}`,
            alt: data.alt || "Random Image",
            location: data.location ?? null,
            captured_year:
              typeof data.captured_year === "number"
                ? data.captured_year
                : null,
          });
        }
      } catch {
        /* keep skeleton */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const caption = image
    ? formatTopCaption(image.location, image.captured_year)
    : null;

  return (
    <div className="home-page relative w-full bg-[#f9f9f7] text-[#050317]">
      {/*
        Hero: logo → catchphrase → photo (natural height, never cropped).
        Desktop: vertically centered in the viewport (sidebar already has nav).
        Phone/tablet: top-aligned so the trio is the first thing you see.
      */}
      <section
        className={cn(
          "flex w-full flex-col items-center",
          "px-5 pb-10 pt-12",
          "min-[768px]:px-10 min-[768px]:pb-14 min-[768px]:pt-16",
          "min-[1080px]:min-h-dvh min-[1080px]:justify-center min-[1080px]:px-12 min-[1080px]:py-16",
        )}
      >
        <div
          className={cn(
            "flex w-full max-w-[56rem] flex-col items-center",
            "gap-6 min-[768px]:gap-8 min-[1080px]:gap-8",
          )}
        >
          <Link href="/" className="block no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/common/logo.svg"
              alt="ezeroms.com"
              className={cn(
                "block h-auto w-[11rem] max-w-[70vw]",
                "min-[768px]:w-[14rem]",
                "min-[1080px]:w-[18.75rem]",
                "transition-opacity hover:opacity-60",
              )}
            />
          </Link>

          <h1
            className={cn(
              "m-0 max-w-[22rem] text-center font-sans italic font-normal",
              "text-[1.05rem] leading-relaxed",
              "min-[768px]:max-w-[28rem] min-[768px]:text-lg",
              "min-[1080px]:max-w-none min-[1080px]:text-[1.25rem]",
            )}
          >
            One thing I can tell you is you got to be free!
          </h1>

          <div className="w-full max-w-[56.625rem]">
            <div className="relative w-full leading-[0]">
              {!image || !loaded ? (
                <div
                  className={cn(
                    "w-full animate-pulse rounded-sm bg-[#e8e8e6]",
                    "aspect-[16/10] min-[1080px]:aspect-[906/514]",
                  )}
                  aria-hidden
                />
              ) : null}
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.image_url}
                  alt={image.alt}
                  className={cn(
                    "m-0 block h-auto w-full max-w-full",
                    "transition-opacity duration-300",
                    loaded ? "relative opacity-100" : "absolute inset-0 opacity-0",
                  )}
                  onLoad={() => setLoaded(true)}
                />
              ) : null}
            </div>
            {caption && loaded ? (
              <p
                className={cn(
                  "m-0 mt-2 text-right font-sans text-sm leading-snug text-muted-foreground",
                )}
              >
                {caption}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* In-page nav: phone/tablet only (desktop uses sidebar) */}
      <nav
        className={cn(
          "mx-auto flex w-full max-w-lg flex-col gap-10 px-5 pb-20",
          "min-[768px]:max-w-2xl min-[768px]:gap-12 min-[768px]:px-10",
          "min-[1080px]:hidden",
        )}
        aria-label="サイトメニュー"
      >
        <HomeNavSection title="Writing">
          <HomeNavCard href={notesHref} label="Notes" icon={NotebookPen} />
          <HomeNavCard href="/column/" label="Column" icon={FileText} />
        </HomeNavSection>

        {photoNav.length > 0 ? (
          <HomeNavSection title="Photos">
            {photoNav.map((item) => (
              <HomeNavCard
                key={item.href}
                href={item.href}
                label={item.label}
                icon={PHOTO_ICONS[item.id]}
              />
            ))}
          </HomeNavSection>
        ) : null}

        {worksNav.length > 0 ? (
          <HomeNavSection title="Works">
            {worksNav.map((item) => (
              <HomeNavCard
                key={item.href}
                href={item.href}
                label={item.label}
                icon={WORKS_ICONS[item.id]}
              />
            ))}
          </HomeNavSection>
        ) : null}

        {libraryNav.length > 0 ? (
          <HomeNavSection title="Library">
            {libraryNav.map((item) => (
              <HomeNavCard
                key={item.href}
                href={item.href}
                label={item.label}
                icon={LIBRARY_ICONS[item.id]}
              />
            ))}
          </HomeNavSection>
        ) : null}

        <HomeNavSection title="About">
          <HomeNavCard href="/about/me/" label="Me" icon={User} />
          <HomeNavCard href="/about/here/" label="Here" icon={House} />
          <HomeNavCard href="/about/contact/" label="Contact" icon={Mail} />
        </HomeNavSection>
      </nav>
    </div>
  );
}
