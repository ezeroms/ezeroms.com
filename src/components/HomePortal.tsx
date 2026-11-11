"use client";

import Link from "next/link";
import { ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClipMemo } from "@/components/ClipList";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { PhotoLightbox } from "@/components/photos/PhotoLightbox";
import { usePhotoLightbox } from "@/components/photos/usePhotoLightbox";
import { photoAccessibilityLabel } from "@/lib/content/photo-caption";
import { lightboxPreviewClass } from "@/lib/site/lightbox-preview";
import type { Photo } from "@/types/content";
import type {
  HomeClipItem,
  HomeGiantItem,
  HomePhotoItem,
  HomePortalData,
  HomeTag,
  HomeWritingItem,
} from "@/lib/content/home-portal";
import { OG_IMAGE_ASPECT_CLASS } from "@/lib/content/og-image";
import { contentCard } from "@/lib/site/card-styles";
import { tagPillClass } from "@/lib/site/tag-styles";
import { cn } from "@/lib/cn";

/** 記事全体のホバー面。中の余白と同じだけ外へ広げ、並びの位置は変えない。 */
const homeArticleClass =
  "relative -mx-3 -my-4 rounded-xl px-3 py-4 transition-colors hover:bg-muted focus-within:bg-muted";

/** 先頭記事の上にはみ出しを見出しの下で受け止める。 */
const homeListClass = "pt-4";

const columnClass =
  "mx-auto w-full max-w-5xl px-5 min-[768px]:px-10 min-[1080px]:px-12";

/**
 * 見出しの上余白。固定の前後で同じにして、固まった瞬間に下がらないようにする。
 * ページ上端とセクション間は、この分だけ詰めて見出しの位置を保つ。
 */
const headingStickPadClass = "pt-6 pb-8";

/** セクション見出しと Diary の日付で共有する表示用の文字。 */
const displayTitleClass =
  "text-[1.75rem] font-normal leading-none tracking-tight text-foreground min-[768px]:text-4xl";

function SectionRule({
  id,
  title,
  dek,
  moreHref,
}: {
  id: string;
  title: string;
  dek: string;
  moreHref?: string | null;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const root = sentinel.closest(".layout-main__content");
    if (!(root instanceof HTMLElement)) return;

    const update = () => {
      const sticky = sentinel.nextElementSibling;
      const stickLine =
        sticky instanceof HTMLElement
          ? Number.parseFloat(getComputedStyle(sticky).top) || 0
          : 0;
      const rootTop = root.getBoundingClientRect().top + stickLine;
      const next = sentinel.getBoundingClientRect().top <= rootTop;
      setStuck((current) => (current === next ? current : next));
    };

    update();
    root.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      root.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-0" />
      <div className="sticky top-14 z-10 bg-white min-[1080px]:top-0">
        <div className={cn(columnClass, headingStickPadClass)}>
          <h2 id={id} className={cn("m-0", displayTitleClass)}>
            {title}
          </h2>
          <p className="m-0 mt-2 text-sm leading-snug text-muted-foreground">
            {dek}
          </p>
        </div>
        {stuck && moreHref ? (
          <div
            className={cn(
              columnClass,
              "pointer-events-none absolute inset-0 flex items-center justify-end",
            )}
          >
            <Link
              href={moreHref}
              className="pointer-events-auto inline-flex items-center gap-0.5 rounded-full px-3 py-2 text-sm leading-none text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-foreground"
            >
              All
              <ChevronRight
                aria-hidden
                className="home-all-chevron size-3.5"
                strokeWidth={1.75}
              />
            </Link>
          </div>
        ) : null}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border",
            !stuck && "hidden",
          )}
        />
      </div>
    </>
  );
}

type TopHeroImage = {
  image_url: string;
  alt: string;
  slug: string;
  location: string | null;
  captured_year: number | null;
  message: string | null;
};

function topHeroCaption(
  location: string | null | undefined,
  year: number | null | undefined,
): string | null {
  const place = (location ?? "").trim();
  const y = typeof year === "number" && Number.isFinite(year) ? String(year) : "";
  if (place && y) return `${place}, ${y}`;
  if (place) return place;
  if (y) return y;
  return null;
}

function readTopImage(data: Partial<TopHeroImage> | null): TopHeroImage | null {
  if (!data?.image_url) return null;
  return {
    image_url: data.image_url,
    alt: data.alt || "",
    slug: data.slug || data.image_url,
    location: data.location ?? null,
    captured_year:
      typeof data.captured_year === "number" ? data.captured_year : null,
    message: data.message?.trim() || null,
  };
}

/** このページで直近に出した枚数。API の上限と揃える。 */
const RECENT_TOP_IMAGES = 8;

function rememberTopImage(recent: string[], slug: string): string[] {
  const next = [slug, ...recent.filter((item) => item !== slug)];
  return next.slice(0, RECENT_TOP_IMAGES);
}

async function fetchTopImage(avoid: readonly string[]): Promise<TopHeroImage | null> {
  const params = new URLSearchParams();
  if (avoid.length) params.set("avoid", avoid.join(","));
  const query = params.toString();
  const res = await fetch(query ? `/api/top-image/?${query}` : "/api/top-image/", {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return readTopImage((await res.json()) as Partial<TopHeroImage>);
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

/** ロゴの下に置く一枚。押したときだけ別の写真を取り直す。 */
function HomeMemory() {
  const requestRef = useRef(0);
  const recentRef = useRef<string[]>([]);
  const [image, setImage] = useState<TopHeroImage | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "empty">("loading");
  const [busy, setBusy] = useState(false);

  const recall = async () => {
    const request = requestRef.current + 1;
    requestRef.current = request;
    setBusy(true);
    try {
      const next = await fetchTopImage(recentRef.current);
      if (request !== requestRef.current) return;
      if (!next) {
        if (!image) setPhase("empty");
        return;
      }
      try {
        await preloadImage(next.image_url);
      } catch {
        if (!image) setPhase("empty");
        return;
      }
      if (request !== requestRef.current) return;
      recentRef.current = rememberTopImage(recentRef.current, next.slug);
      setImage(next);
      setPhase("ready");
    } catch {
      if (request === requestRef.current && !image) setPhase("empty");
    } finally {
      if (request === requestRef.current) setBusy(false);
    }
  };

  useEffect(() => {
    void recall();
    return () => {
      requestRef.current += 1;
    };
    // 初回だけ取る。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "empty") return null;

  const caption = image
    ? topHeroCaption(image.location, image.captured_year)
    : null;
  const message = image?.message ?? null;

  const memoryFrameClass =
    "-mx-5 block h-auto w-[calc(100%+2.5rem)] max-w-none rounded-none min-[768px]:mx-0 min-[768px]:w-full min-[768px]:rounded-lg";

  return (
    <figure id="home-memory" className="m-0 mt-12 w-full min-[768px]:mt-16">
      {phase !== "ready" || !image ? (
        <div className={cn("aspect-video bg-muted", memoryFrameClass)} aria-hidden />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.image_url}
          alt={image.alt || caption || ""}
          className={cn("m-0", memoryFrameClass)}
        />
      )}
      <div className="mt-3 min-[768px]:flex min-[768px]:items-center min-[768px]:justify-between min-[768px]:gap-3">
        <figcaption className="m-0 min-w-0 max-w-full text-right text-sm leading-relaxed text-muted-foreground min-[768px]:flex-1 min-[768px]:text-left min-[768px]:leading-none">
          {caption ? <span>{caption}</span> : null}
          {message ? (
            <span className={caption ? "ml-3 min-[768px]:ml-2.5" : undefined}>
              {message}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void recall()}
            disabled={busy || phase !== "ready"}
            aria-busy={busy}
            aria-label="Another moment"
            className="relative ml-1.5 inline-flex -mr-1.5 -translate-y-[2px] cursor-pointer items-center rounded-full border-0 bg-transparent p-1.5 align-middle font-[inherit] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default disabled:opacity-60 min-[768px]:hidden"
          >
            <RefreshCw
              aria-hidden
              className={cn("size-3.5", busy && "animate-spin")}
              strokeWidth={1.75}
            />
          </button>
        </figcaption>
        <button
          type="button"
          onClick={() => void recall()}
          disabled={busy || phase !== "ready"}
          aria-busy={busy}
          className="hidden shrink-0 cursor-pointer items-center gap-2 rounded-full border-0 bg-transparent px-3 py-1 font-[inherit] text-sm leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default disabled:opacity-60 min-[768px]:-mr-3 min-[768px]:inline-flex"
        >
          <RefreshCw
            aria-hidden
            className={cn("size-3.5", busy && "animate-spin")}
            strokeWidth={1.75}
          />
          Another moment
        </button>
      </div>
    </figure>
  );
}

function HomeTags({
  tags,
  className,
}: {
  tags: HomeTag[];
  className?: string;
}) {
  if (!tags.length) return null;
  return (
    <p className={cn("relative z-[1] m-0 mt-3 flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <Link key={tag.href} href={tag.href} className={tagPillClass(false)}>
          {tag.label}
        </Link>
      ))}
    </p>
  );
}

function Dateline({
  dateLabel,
  dateTime,
}: {
  dateLabel: string;
  dateTime: string;
}) {
  if (!dateLabel) return null;
  return (
    <p className="m-0 text-sm text-muted-foreground">
      <time dateTime={dateTime}>{dateLabel}</time>
    </p>
  );
}

function OgFrame({
  src,
  rounded,
  className,
}: {
  src: string;
  rounded?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={cn(
        OG_IMAGE_ASPECT_CLASS,
        "pointer-events-none m-0 block w-full object-cover",
        rounded && "rounded-lg",
        className,
      )}
    />
  );
}

function HomeArticleLink({
  href,
  external,
  label,
}: {
  href: string;
  external?: boolean;
  label: string;
}) {
  const className = "absolute inset-0 z-0 cursor-pointer rounded-[inherit]";
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={className}
      />
    );
  }
  return <Link href={href} aria-label={label} className={className} />;
}

function DiaryDateTitle({ iso }: { iso: string }) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  const monthNum = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const weekday = parsed
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();
  const month = parsed
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const year = String(parsed.getFullYear());

  return (
    <h3 className="m-0 font-normal">
      <time dateTime={iso} className="flex items-end gap-3">
        <span className={cn(displayTitleClass, "tabular-nums")}>
          {monthNum}/{day}
        </span>
        <span className="mb-1 flex flex-row items-baseline gap-1.5 text-[0.7rem] font-normal uppercase leading-tight tracking-[0.14em] text-muted-foreground min-[768px]:flex-col min-[768px]:gap-0">
          <span>{weekday}</span>
          <span>
            {month} {year}
          </span>
        </span>
      </time>
    </h3>
  );
}

function DiaryList({ items }: { items: HomeWritingItem[] }) {
  return (
    <ul className={cn("m-0 flex list-none flex-col gap-12 p-0", homeListClass)}>
      {items.map((item) => (
        <li key={item.id}>
          <article
            className={cn(
              homeArticleClass,
              "flex flex-col gap-3 min-[768px]:flex-row min-[768px]:items-center min-[768px]:gap-8",
            )}
          >
            <HomeArticleLink
              href={item.href}
              label={item.headline ? `${item.dateLabel} ${item.headline}` : item.dateLabel}
            />
            {item.image ? (
              <OgFrame
                src={item.image}
                rounded
                /* 768px以上は 1200/630。この幅のとき高さが日付＋3行＋タグと揃う。 */
                className="w-full min-[768px]:w-[20.119rem] min-[768px]:shrink-0"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <DiaryDateTitle iso={item.dateTime} />
              {item.headline ? (
                <p className="m-0 mt-3 line-clamp-3 text-base font-normal leading-relaxed text-foreground">
                  {item.headline}
                </p>
              ) : null}
              <HomeTags tags={item.tags} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

function WritingIndex({ items }: { items: HomeWritingItem[] }) {
  if (!items.length) return null;
  return (
    <ul className={cn("m-0 grid list-none grid-cols-1 gap-x-12 gap-y-12 p-0 min-[768px]:grid-cols-2", homeListClass)}>
      {items.map((item) => (
        <li key={item.id}>
          <article className={homeArticleClass}>
            <HomeArticleLink href={item.href} label={item.headline} />
            {item.image ? (
              <OgFrame src={item.image} rounded className="mb-3" />
            ) : null}
            <Dateline dateLabel={item.dateLabel} dateTime={item.dateTime} />
            <h3 className="m-0 mt-3 line-clamp-3 text-lg font-medium leading-normal text-foreground min-[768px]:text-xl">
              {item.headline}
            </h3>
            <HomeTags tags={item.tags} className="mt-4" />
          </article>
        </li>
      ))}
    </ul>
  );
}

function lightboxPhoto(item: HomePhotoItem): Photo {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    date: item.date,
    location: item.location,
    camera: null,
    image_url: item.imageUrl,
    image_thumb_url: item.src,
    photo_tag: [],
    body_html: "",
    status: "published",
    published_at: null,
    created_at: item.date,
    updated_at: item.date,
  };
}

function PhotoBlock({ items }: { items: HomePhotoItem[] }) {
  const photos = useMemo(() => items.map(lightboxPhoto), [items]);
  const {
    displayPhotos,
    isClientMounted,
    activePhoto,
    openLightbox,
    closeLightbox,
    showPreviousPhoto,
    showNextPhoto,
  } = usePhotoLightbox(photos);
  const detailBasePath = items[0]?.galleryHref;

  return (
    <>
      <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-8 p-0 min-[900px]:grid-cols-3 min-[900px]:gap-x-6">
        {items.map((item) => (
          <li key={item.id}>
            <figure className="m-0">
              <button
                type="button"
                className="block w-full cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => openLightbox(item.id)}
                aria-label={`${photoAccessibilityLabel(lightboxPhoto(item))} を拡大表示`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt=""
                  className={cn(
                    "m-0 block aspect-[4/3] w-full object-cover",
                    lightboxPreviewClass,
                  )}
                />
              </button>
              {item.caption ? (
                <figcaption className="mt-2 text-sm leading-snug text-muted-foreground">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ul>
      {isClientMounted && activePhoto ? (
        <PhotoLightbox
          photo={activePhoto}
          photos={displayPhotos}
          detailBasePath={detailBasePath}
          onClose={closeLightbox}
          onShowPrevious={showPreviousPhoto}
          onShowNext={showNextPhoto}
        />
      ) : null}
    </>
  );
}

function ClipIndex({ items }: { items: HomeClipItem[] }) {
  return (
    <ul className={cn("m-0 flex list-none flex-col gap-12 p-0", homeListClass)}>
      {items.map((item) => (
        <li key={item.id}>
          <article
            className={cn(
              homeArticleClass,
              "flex flex-col gap-3 min-[768px]:flex-row min-[768px]:items-center min-[768px]:gap-8",
            )}
          >
            <HomeArticleLink href={item.href} external label={item.title} />
            {item.image ? (
              <OgFrame
                src={item.image}
                rounded
                className="w-full min-[768px]:w-64 min-[768px]:shrink-0"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 overflow-hidden text-sm leading-tight text-muted-foreground">
                {item.dateLabel ? (
                  <time dateTime={item.dateTime}>{item.dateLabel}</time>
                ) : null}
                {item.dateLabel && item.source ? (
                  <span aria-hidden>·</span>
                ) : null}
                {item.source ? (
                  <span className="truncate">{item.source}</span>
                ) : null}
              </div>
              <h3 className="m-0 mt-1.5 line-clamp-3 text-base font-medium leading-snug">
                {item.title}
              </h3>
              {item.memo ? (
                <div className="mt-3">
                  <ClipMemo>{item.memo}</ClipMemo>
                </div>
              ) : null}
              <HomeTags tags={item.tags} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

function GiantIndex({ items }: { items: HomeGiantItem[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-6 p-0">
      {items.map((item) => (
        <li key={item.id}>
          <article
            className={cn(
              contentCard({ link: true }),
              "relative px-6 py-6 min-[768px]:px-8 min-[768px]:py-8",
            )}
          >
            <div className="flex flex-col gap-4 text-base font-normal leading-relaxed">
              {item.paragraphs.map((paragraph, index) => (
                <p key={index} className="m-0 whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
            {item.citation ? (
              <p className="m-0 mt-5 text-sm leading-snug text-muted-foreground">
                {item.citation}
              </p>
            ) : null}
            <HomeTags tags={item.tags} />
            <Link
              href={item.href}
              aria-label={item.citation || "引用"}
              className="absolute inset-0 rounded-[inherit]"
            />
          </article>
        </li>
      ))}
    </ul>
  );
}

export function HomePortal({ data }: { data: HomePortalData }) {
  const hasDiary = data.diaries.length > 0;
  const hasColumn = data.columns.length > 0;
  const hasSmile = data.smile.length > 0;
  const hasJampai = data.jampai.length > 0;
  const hasClips = data.clips.length > 0;
  const hasGiants = data.giants.length > 0;
  const empty =
    !hasDiary && !hasColumn && !hasSmile && !hasJampai && !hasClips && !hasGiants;

  return (
    <div className="bg-white text-foreground">
      <div className="sticky top-0 z-20 flex h-14 items-center border-0 border-b border-solid border-border bg-white px-4 min-[1080px]:hidden">
        <MobileMenuButton />
      </div>

      <div className="bg-white pb-8 min-[768px]:pb-12 min-[1080px]:pb-14">
        <div
          className={cn(
            columnClass,
            "pb-16 pt-14 text-center min-[768px]:pb-20 min-[768px]:pt-16",
          )}
        >
          <h1 className="m-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              id="home-masthead-logo"
              src="/images/common/logo.svg"
              alt="ezeroms.com"
              className="mx-auto block h-auto w-[13rem] min-[768px]:w-[16.5rem]"
            />
          </h1>
          <p className="m-0 mt-5 text-sm italic leading-relaxed text-muted-foreground min-[768px]:text-base">
            One thing I can tell you is you got to be free!
          </p>
          <HomeMemory />
          {empty ? (
            <p className="m-0 mt-10 text-base text-muted-foreground">
              まだ公開されているものがありません。
            </p>
          ) : null}
        </div>

        {hasDiary ? (
          <section aria-labelledby="home-diary">
            <SectionRule
              id="home-diary"
              title="Diary"
              dek="日記"
              moreHref={data.diaryHref}
            />
            <div className={columnClass}>
              <DiaryList items={data.diaries} />
            </div>
          </section>
        ) : null}

        {hasColumn ? (
          <section
            aria-labelledby="home-column"
            className={cn(hasDiary && "mt-[4.5rem]")}
          >
            <SectionRule
              id="home-column"
              title="Column"
              dek="コラム"
              moreHref={data.columnHref}
            />
            <div className={columnClass}>
              <WritingIndex items={data.columns} />
            </div>
          </section>
        ) : null}

        {hasSmile ? (
          <section
            aria-labelledby="home-smile"
            className={cn((hasDiary || hasColumn) && "mt-[4.5rem]")}
          >
            <SectionRule
              id="home-smile"
              title="Smile"
              dek="笑顔の写真"
              moreHref={data.smileHref}
            />
            <div className={columnClass}>
              <PhotoBlock items={data.smile} />
            </div>
          </section>
        ) : null}

        {hasJampai ? (
          <section
            aria-labelledby="home-jampai"
            className={cn((hasDiary || hasColumn || hasSmile) && "mt-[4.5rem]")}
          >
            <SectionRule
              id="home-jampai"
              title="Jampai"
              dek="麻雀牌の写真"
              moreHref={data.jampaiHref}
            />
            <div className={columnClass}>
              <PhotoBlock items={data.jampai} />
            </div>
          </section>
        ) : null}

        {hasClips ? (
          <section
            aria-labelledby="home-clips"
            className={cn((hasDiary || hasColumn || hasSmile || hasJampai) && "mt-[4.5rem]")}
          >
            <SectionRule
              id="home-clips"
              title="Clips"
              dek="気になるニュース、話題"
              moreHref={data.clipsHref}
            />
            <div className={columnClass}>
              <ClipIndex items={data.clips} />
            </div>
          </section>
        ) : null}

        {hasGiants ? (
          <section
            aria-labelledby="home-giants"
            className={cn(
              (hasDiary || hasColumn || hasSmile || hasJampai || hasClips) && "mt-[4.5rem]",
            )}
          >
            <SectionRule
              id="home-giants"
              title="The shoulders of Giants"
              dek="先人の知恵"
              moreHref={data.giantsHref}
            />
            <div className={columnClass}>
              <GiantIndex items={data.giants} />
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
