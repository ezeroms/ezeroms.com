import type { Column } from "@/types/content";
import { COLUMN_CATEGORY_NAMES } from "@/components/ColumnHeaderNav";
import {
  ContentThumbCard,
  contentThumbCardListClassName,
} from "@/components/ContentThumbCard";
import {
  columnExcerpt,
  columnThumbSrc,
  formatColumnDate,
} from "@/lib/content/column-meta";
import { cn } from "@/lib/cn";
import { tagChipClass } from "@/lib/site/tag-styles";

type Props = {
  items: Column[];
  currentCategory?: string;
  currentTag?: string;
  /** 関連記事など、空のときにメッセージを出さない */
  hideEmpty?: boolean;
  /** 一覧のルート要素 id（省略可） */
  listId?: string;
  /** 記事 og_image 未設定時のサムネフォールバック（カテゴリ OGP） */
  fallbackThumbSrc?: string | null;
};

/**
 * Column 一覧カード列。
 * 見た目の骨格は ContentThumbCard（Media coverage と共通）。
 */
export function ColumnList({
  items,
  currentCategory,
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
    <div className={contentThumbCardListClassName()} id={listId}>
      {items.map((item) => {
        const href = `/column/${item.slug}/`;
        const thumb = columnThumbSrc(
          item.body_html,
          item.og_image,
          item.slug,
          fallbackThumbSrc,
        );
        const excerpt = columnExcerpt(item.body_html, 120);
        const category = item.column_category?.[0];
        const categoryLabel = category
          ? (COLUMN_CATEGORY_NAMES[category] ?? category)
          : null;
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
            metaSecondary={
              categoryLabel ? (
                <span
                  className={cn(
                    currentCategory === category &&
                      "font-semibold text-foreground",
                  )}
                >
                  {categoryLabel}
                </span>
              ) : null
            }
            excerpt={excerpt}
            footer={
              tags.length
                ? tags.slice(0, 4).map((tag) => (
                    <span key={tag} className={tagChipClass(currentTag === tag)}>
                      {tag}
                    </span>
                  ))
                : null
            }
          />
        );
      })}
    </div>
  );
}
