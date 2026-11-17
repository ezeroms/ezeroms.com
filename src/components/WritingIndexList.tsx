import Link from "next/link";
import { OG_IMAGE_ASPECT_CLASS } from "@/lib/content/og-image";
import { tagPillClass } from "@/lib/site/tag-styles";
import { cn } from "@/lib/cn";

/** トップページの本文カラム。一覧もこの幅に揃える。 */
export const writingColumnClass =
  "mx-auto w-full max-w-5xl px-5 min-[768px]:px-10 min-[1080px]:px-12";

const articleClass =
  "relative -mx-3 -my-4 rounded-xl px-3 py-4 transition-colors hover:bg-muted focus-within:bg-muted";

export type WritingIndexTag = {
  label: string;
  href: string;
  active?: boolean;
};

export type WritingIndexItem = {
  id: string;
  href: string;
  label: string;
  image: string | null;
  dateLabel?: string;
  dateTime?: string;
  title?: string;
  excerpt?: string;
  tags: WritingIndexTag[];
};

function Frame({ src }: { src: string | null }) {
  return (
    <span
      className={cn(
        OG_IMAGE_ASPECT_CLASS,
        "relative mb-3 block overflow-hidden rounded-lg bg-muted",
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="pointer-events-none absolute inset-0 m-0 h-full w-full object-cover"
        />
      ) : null}
    </span>
  );
}

/**
 * ダイアリーとコラムの一覧。トップのコラムと同じ、写真を上に置いた二列。
 */
export function WritingIndexList({
  items,
  empty,
  listId,
}: {
  items: WritingIndexItem[];
  empty: string;
  listId?: string;
}) {
  if (!items.length) {
    return <p className="py-10 text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <ul
      id={listId}
      className="m-0 grid list-none grid-cols-1 gap-x-12 gap-y-12 p-0 pt-4 min-[768px]:grid-cols-2"
    >
      {items.map((item) => (
        <li key={item.id}>
          <article className={articleClass}>
            <Link
              href={item.href}
              aria-label={item.label}
              className="absolute inset-0 z-0 cursor-pointer rounded-[inherit]"
            />
            <Frame src={item.image} />
            {item.dateLabel ? (
              <p className="m-0 text-sm text-muted-foreground">
                {item.dateTime ? (
                  <time dateTime={item.dateTime}>{item.dateLabel}</time>
                ) : (
                  item.dateLabel
                )}
              </p>
            ) : null}
            {item.title ? (
              <h2 className="m-0 mt-3 line-clamp-3 text-lg font-medium leading-normal text-foreground min-[768px]:text-xl">
                {item.dateTime && !item.dateLabel ? (
                  <time dateTime={item.dateTime}>{item.title}</time>
                ) : (
                  item.title
                )}
              </h2>
            ) : null}
            {item.excerpt ? (
              <p className="m-0 mt-3 line-clamp-3 text-base font-normal leading-relaxed text-foreground">
                {item.excerpt}
              </p>
            ) : null}
            {item.tags.length ? (
              <p className="relative z-[1] m-0 mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Link
                    key={tag.href}
                    href={tag.href}
                    className={tagPillClass(Boolean(tag.active))}
                  >
                    {tag.label}
                  </Link>
                ))}
              </p>
            ) : null}
          </article>
        </li>
      ))}
    </ul>
  );
}
