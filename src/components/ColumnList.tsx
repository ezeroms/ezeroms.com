import Link from "next/link";
import type { Column } from "@/types/content";
import {
  ContentThumbCard,
  contentPlainListClassName,
} from "@/components/ContentThumbCard";
import {
  columnExcerpt,
  columnThumbSrc,
  formatColumnDate,
} from "@/lib/content/column-meta";
import { columnTagHref } from "@/lib/content/column-filter";
import { tagPillClass } from "@/lib/site/tag-styles";

type Props = {
  items: Column[];
  currentTag?: string;
  /** 関連記事など、空のときにメッセージを出さない */
  hideEmpty?: boolean;
  /** 一覧のルート要素 id（省略可） */
  listId?: string;
  /** 記事 og_image 未設定時のサムネフォールバック（カテゴリ OGP） */
  fallbackThumbSrc?: string | null;
  className?: string;
};

/**
 * Column 一覧。枠なし。骨格は ContentThumbCard。
 */
export function ColumnList({
  items,
  currentTag,
  hideEmpty,
  listId,
  fallbackThumbSrc = null,
  className,
}: Props) {
  if (!items.length) {
    if (hideEmpty) return null;
    return (
      <p className="py-10 text-sm text-muted-foreground">
        まだ記事がありません。
      </p>
    );
  }

  return (
    <div className={contentPlainListClassName(className)} id={listId}>
      {items.map((item) => {
        const href = `/column/${item.slug}/`;
        const thumb = columnThumbSrc(
          item.body_html,
          item.og_image,
          item.slug,
          fallbackThumbSrc,
        );
        const excerpt = columnExcerpt(item.body_html, 160);
        const tags = [...(item.column_tag ?? [])].sort((a, b) =>
          a.localeCompare(b, "ja"),
        );

        return (
          <ContentThumbCard
            key={item.id}
            href={href}
            title={item.title}
            thumbSrc={thumb}
            dateTime={item.date}
            dateLabel={formatColumnDate(item.date)}
            excerpt={excerpt}
            excerptLines={3}
            excerptClassName="text-[0.9375rem] leading-[1.7]"
            footer={
              tags.length
                ? tags.slice(0, 4).map((tag) => (
                    <Link
                      key={tag}
                      href={columnTagHref(tag)}
                      className={tagPillClass(currentTag === tag)}
                    >
                      {tag}
                    </Link>
                  ))
                : null
            }
            chrome="plain"
            thumbAspect="og"
            hoverSurface
          />
        );
      })}
    </div>
  );
}
