"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TopImagePayload = {
  image_url: string;
  alt: string;
};

type Props = {
  diaryHref: string;
};

export function HomeRandomImage({ diaryHref }: Props) {
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
            <Link href="/">
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
            <Link href="/">
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
            </Link>
          </div>

          {/* SP/タブレット専用ナビ（PCでは親 section が display:none） */}
          <nav className="top-nav-mobile">
            <div className="top-nav-mobile__section">
              <h3 className="top-nav-mobile__heading">Writing</h3>
              <Link href={diaryHref} className="top-nav-mobile__link">
                Notes
              </Link>
              <Link href="/column/" className="top-nav-mobile__link">
                Column
              </Link>
            </div>
            <div className="top-nav-mobile__section">
              <h3 className="top-nav-mobile__heading">Photos</h3>
              <Link href="/smile/" className="top-nav-mobile__link">
                Smile
              </Link>
              <Link href="/jumpai/" className="top-nav-mobile__link">
                Jumpai
              </Link>
            </div>
            <div className="top-nav-mobile__section">
              <h3 className="top-nav-mobile__heading">Works</h3>
              <Link href="/works/creative/" className="top-nav-mobile__link">
                Creative
              </Link>
              <Link href="/works/experience/" className="top-nav-mobile__link">
                Experience
              </Link>
              <Link href="/works/chooning/" className="top-nav-mobile__link">
                Chooning
              </Link>
            </div>
            <div className="top-nav-mobile__section">
              <h3 className="top-nav-mobile__heading">Library</h3>
              <Link href="/clips/" className="top-nav-mobile__link">
                Clips
              </Link>
              <Link
                href="/shoulders-of-giants/"
                className="top-nav-mobile__link"
              >
                The shoulders of Giants
              </Link>
              <Link href="/chronicle/" className="top-nav-mobile__link">
                Chronicle
              </Link>
            </div>
            <div className="top-nav-mobile__section">
              <h3 className="top-nav-mobile__heading">About</h3>
              <Link href="/about/me/" className="top-nav-mobile__link">
                Me
              </Link>
              <Link href="/about/here/" className="top-nav-mobile__link">
                Here
              </Link>
              <Link
                href="/about/media-coverage/"
                className="top-nav-mobile__link"
              >
                Media coverage
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
