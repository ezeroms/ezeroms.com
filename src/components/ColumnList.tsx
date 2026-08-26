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
    <div className={contentPlainListClassName()} id={listId}>
      {items.map((item, index) => {
        const href = `/column/${item.slug}/`;
        const thumb = columnThumbSrc(
          item.body_html,
          item.og_image,
          item.slug,
          fallbackThumbSrc,
        );
        const excerpt = columnExcerpt(item.body_html, 120);
        const tags = [...(item.column_tag ?? [])].sort((a, b) =>
          a.localeCompare(b, "ja"),
        );

        return (
          <div key={item.id}>
            {index > 0 ? (
              <div className="h-px bg-border-subtle" aria-hidden />
            ) : null}
            <div className="py-7">
              <ContentThumbCard
                href={href}
                title={item.title}
                thumbSrc={thumb}
                dateTime={item.date}
                dateLabel={formatColumnDate(item.date)}
                excerpt={excerpt}
                footer={
                  tags.length
                    ? tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className={tagPillClass(currentTag === tag)}
                        >
                          {tag}
                        </span>
                      ))
                    : null
                }
                chrome="plain"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
