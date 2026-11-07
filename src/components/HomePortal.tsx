import Link from "next/link";
import { MobileMenuButton } from "@/components/MobileMenuButton";
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

const linkClass =
  "text-inherit no-underline hover:underline hover:underline-offset-4";

function SectionRule({
  id,
  title,
  dek,
}: {
  id: string;
  title: string;
  dek: string;
}) {
  return (
    <div className="mb-10">
      <h2
        id={id}
        className="m-0 text-[1.75rem] font-normal leading-none tracking-tight text-foreground min-[768px]:text-4xl"
      >
        {title}
      </h2>
      <p className="m-0 mt-2 text-sm leading-snug text-muted-foreground">{dek}</p>
    </div>
  );
}

function SectionMore({ href }: { href: string }) {
  return (
    <p className="m-0 mt-12 text-base">
      <Link href={href} className={linkClass}>
        すべて
      </Link>
    </p>
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
    <p className={cn("m-0 mt-3 flex flex-wrap gap-2", className)}>
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
  href,
  external,
  rounded,
  className,
}: {
  src: string;
  href: string;
  external?: boolean;
  rounded?: boolean;
  className?: string;
}) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={cn(
        OG_IMAGE_ASPECT_CLASS,
        "m-0 block w-full object-cover transition-opacity hover:opacity-80",
        rounded && "rounded-lg",
      )}
    />
  );
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("block no-underline", className)}
      >
        {image}
      </a>
    );
  }
  return (
    <Link href={href} className={cn("block no-underline", className)}>
      {image}
    </Link>
  );
}

function DiaryDateTitle({ iso, href }: { iso: string; href: string }) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  const day = String(parsed.getDate());
  const weekday = parsed
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();
  const month = parsed
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const year = String(parsed.getFullYear());

  return (
    <h3 className="m-0 font-normal">
      <Link href={href} className={linkClass}>
        <time dateTime={iso} className="flex items-end gap-3">
          <span className="text-4xl font-medium tabular-nums leading-none tracking-tight min-[768px]:text-5xl">
            {day}
          </span>
          <span className="mb-1 flex flex-col text-[0.7rem] font-medium uppercase leading-tight tracking-[0.14em] text-muted-foreground">
            <span>{weekday}</span>
            <span>
              {month} {year}
            </span>
          </span>
        </time>
      </Link>
    </h3>
  );
}

function DiaryList({ items }: { items: HomeWritingItem[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-12 p-0">
      {items.map((item) => (
        <li key={item.id}>
          <article className="flex items-center gap-4 min-[768px]:gap-8">
            {item.image ? (
              <OgFrame
                src={item.image}
                href={item.href}
                rounded
                /* 1200/630。この幅のとき高さが日付＋3行＋タグと揃う。 */
                className="w-32 shrink-0 min-[768px]:w-[21.071rem]"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <DiaryDateTitle iso={item.dateTime} href={item.href} />
              {item.headline ? (
                <p className="m-0 mt-3 line-clamp-3 text-base font-normal leading-relaxed text-foreground">
                  <Link href={item.href} className={linkClass}>
                    {item.headline}
                  </Link>
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
    <ul className="m-0 grid list-none grid-cols-1 gap-x-12 gap-y-12 p-0 min-[768px]:grid-cols-2">
      {items.map((item) => (
        <li key={item.id}>
          <article>
            {item.image ? (
              <OgFrame
                src={item.image}
                href={item.href}
                rounded
                className="mb-3"
              />
            ) : null}
            <Dateline dateLabel={item.dateLabel} dateTime={item.dateTime} />
            <h3 className="m-0 mt-1.5 line-clamp-3 text-base font-medium leading-snug text-foreground">
              <Link href={item.href} className={linkClass}>
                {item.headline}
              </Link>
            </h3>
            <HomeTags tags={item.tags} />
          </article>
        </li>
      ))}
    </ul>
  );
}

function PhotoBlock({ items }: { items: HomePhotoItem[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-8 p-0 min-[900px]:grid-cols-3 min-[900px]:gap-x-6">
      {items.map((item) => (
        <li key={item.id}>
          <figure className="m-0">
            <Link href={item.href} className="block no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt}
                className="m-0 block aspect-[4/3] w-full object-cover transition-opacity hover:opacity-80"
              />
            </Link>
            <figcaption className="mt-2 text-sm leading-snug text-muted-foreground">
              <Link href={item.galleryHref} className={linkClass}>
                {item.galleryLabel}
              </Link>
              {item.caption ? <span> · {item.caption}</span> : null}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

function ClipIndex({ items }: { items: HomeClipItem[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-12 p-0">
      {items.map((item) => (
        <li key={item.id}>
          <article className="flex items-center gap-4 min-[768px]:gap-8">
            {item.image ? (
              <OgFrame
                src={item.image}
                href={item.href}
                external
                rounded
                className="w-32 shrink-0 min-[768px]:w-64"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm text-muted-foreground">
                {item.source}
                {item.dateLabel ? (
                  <>
                    <span aria-hidden> · </span>
                    <time dateTime={item.dateTime}>{item.dateLabel}</time>
                  </>
                ) : null}
              </p>
              <h3 className="m-0 mt-1.5 line-clamp-3 text-base font-medium leading-snug">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {item.title}
                </a>
              </h3>
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
            <HomeTags tags={item.tags} className="relative z-10" />
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
  const hasPhotos = data.photos.length > 0;
  const hasClips = data.clips.length > 0;
  const hasGiants = data.giants.length > 0;
  const empty = !hasDiary && !hasColumn && !hasPhotos && !hasClips && !hasGiants;

  return (
    <div className="bg-white text-foreground">
      <div className="sticky top-0 z-20 flex h-14 items-center border-0 border-b border-solid border-border bg-white px-4 min-[1080px]:hidden">
        <MobileMenuButton />
      </div>

      <div className="mx-auto w-full max-w-5xl px-5 py-8 min-[768px]:px-10 min-[768px]:py-12 min-[1080px]:px-12 min-[1080px]:py-14">
        <h1 className="sr-only">ezeroms.com</h1>

        {empty ? (
          <p className="m-0 text-base text-muted-foreground">
            まだ公開されているものがありません。
          </p>
        ) : null}

        {hasDiary ? (
          <section aria-labelledby="home-diary">
            <SectionRule
              id="home-diary"
              title="Diary"
              dek="考えたこと、感じたこと"
            />
            <DiaryList items={data.diaries} />
            {data.diaryHref ? <SectionMore href={data.diaryHref} /> : null}
          </section>
        ) : null}

        {hasColumn ? (
          <section
            aria-labelledby="home-column"
            className={cn(hasDiary && "mt-24")}
          >
            <SectionRule
              id="home-column"
              title="Column"
              dek="コラム"
            />
            <WritingIndex items={data.columns} />
            {data.columnHref ? <SectionMore href={data.columnHref} /> : null}
          </section>
        ) : null}

        {hasPhotos ? (
          <section
            aria-labelledby="home-photos"
            className={cn((hasDiary || hasColumn) && "mt-24")}
          >
            <SectionRule
              id="home-photos"
              title="Photos"
              dek="笑顔と麻雀牌の写真"
            />
            <PhotoBlock items={data.photos} />
          </section>
        ) : null}

        {hasClips ? (
          <section
            aria-labelledby="home-clips"
            className={cn((hasDiary || hasColumn || hasPhotos) && "mt-24")}
          >
            <SectionRule
              id="home-clips"
              title="Clips"
              dek="気になるニュース、話題"
            />
            <ClipIndex items={data.clips} />
            {data.clipsHref ? <SectionMore href={data.clipsHref} /> : null}
          </section>
        ) : null}

        {hasGiants ? (
          <section
            aria-labelledby="home-giants"
            className={cn(
              (hasDiary || hasColumn || hasPhotos || hasClips) && "mt-24",
            )}
          >
            <SectionRule
              id="home-giants"
              title="The shoulders of Giants"
              dek="先人たちの知恵"
            />
            <GiantIndex items={data.giants} />
            {data.giantsHref ? <SectionMore href={data.giantsHref} /> : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
