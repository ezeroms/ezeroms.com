"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  href: string;
  label: string;
};

export type HomeWorksNavItem = {
  href: string;
  label: string;
};

export type HomeLibraryNavItem = {
  href: string;
  label: string;
};

type Props = {
  notesHref: string;
  photoNav?: HomePhotoNavItem[];
  worksNav?: HomeWorksNavItem[];
  libraryNav?: HomeLibraryNavItem[];
};

export function HomeRandomImage({
  notesHref,
  photoNav = [
    { href: "/smile/", label: "Smile" },
    { href: "/jumpai/", label: "Jampai" },
    { href: "/kuikake/", label: "Kuikake" },
  ],
  worksNav = [
    { href: "/works/creative/", label: "Creative" },
    { href: "/works/experience/", label: "Experience" },
    { href: "/works/chooning/", label: "Chooning" },
  ],
  libraryNav = [
    { href: "/clips/", label: "Clips" },
    { href: "/shoulders-of-giants/", label: "The shoulders of Giants" },
    { href: "/chronicle/", label: "Chronicle" },
    { href: "/about/media-coverage/", label: "Media coverage" },
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

  const photoClass = loaded ? "top-photo loaded" : "top-photo";
  const photoMobileClass = loaded
    ? "top-photo-mobile loaded"
    : "top-photo-mobile";
  const caption = image
    ? formatTopCaption(image.location, image.captured_year)
    : null;

  return (
    <>
      <section className="page-section page-section--top page-section--top-desktop">
        <div className="page-section__content page-section__content--narrow">
          <Link href="/" className="top-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/common/logo.svg"
              alt="ezeroms.com"
              className="top-logo__img"
            />
          </Link>
          <h2 className="top-message">
            One thing I can tell you is you got to be free!
          </h2>
          <div className="random-image">
            <Link href="/" className="random-image__link">
              {!image || !loaded ? (
                <div className="top-photo-skeleton" id="topPhotoSkeleton" />
              ) : null}
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.image_url}
                  alt={image.alt}
                  className={photoClass}
                  onLoad={() => setLoaded(true)}
                />
              ) : null}
              {caption && loaded ? (
                <span className="top-photo-caption" aria-hidden="true">
                  {caption}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </section>

      <section className="page-section page-section--top page-section--top-mobile">
        <div className="page-section__content page-section__content--mobile">
          <Link href="/" className="top-logo-mobile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/common/logo.svg"
              alt="ezeroms.com"
              className="top-logo-mobile__img"
            />
          </Link>
          <h2 className="top-message-mobile">
            One thing I can tell you is you got to be free!
          </h2>
          <div className="random-image-mobile">
            <Link href="/" className="random-image-mobile__link">
              {!image || !loaded ? (
                <div
                  className="top-photo-skeleton top-photo-skeleton--mobile"
                  id="topPhotoSkeletonMobile"
                />
              ) : null}
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.image_url}
                  alt={image.alt}
                  className={photoMobileClass}
                  onLoad={() => setLoaded(true)}
                />
              ) : null}
              {caption && loaded ? (
                <span
                  className="top-photo-caption top-photo-caption--mobile"
                  aria-hidden="true"
                >
                  {caption}
                </span>
              ) : null}
            </Link>
          </div>

          <nav className="top-nav-mobile">
            <div className="top-nav-mobile__section">
              <h3 className="top-nav-mobile__heading">Writing</h3>
              <Link href={notesHref} className="top-nav-mobile__link">
                Notes
              </Link>
              <Link href="/column/" className="top-nav-mobile__link">
                Column
              </Link>
            </div>
            {photoNav.length > 0 ? (
              <div className="top-nav-mobile__section">
                <h3 className="top-nav-mobile__heading">Photos</h3>
                {photoNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="top-nav-mobile__link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
            {worksNav.length > 0 ? (
              <div className="top-nav-mobile__section">
                <h3 className="top-nav-mobile__heading">Works</h3>
                {worksNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="top-nav-mobile__link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
            {libraryNav.length > 0 ? (
              <div className="top-nav-mobile__section">
                <h3 className="top-nav-mobile__heading">Library</h3>
                {libraryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="top-nav-mobile__link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="top-nav-mobile__section">
              <h3 className="top-nav-mobile__heading">About</h3>
              <Link href="/about/me/" className="top-nav-mobile__link">
                Me
              </Link>
              <Link href="/about/here/" className="top-nav-mobile__link">
                Here
              </Link>
              <Link href="/about/contact/" className="top-nav-mobile__link">
                Contact
              </Link>
            </div>
          </nav>
        </div>
      </section>
    </>
  );
}
