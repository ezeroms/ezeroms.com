import type { Work } from "@/types/content";
import { WORK_CATEGORY_NAMES } from "@/components/WorkHeaderNav";
import {
  ContentThumbCard,
  contentPlainListClassName,
} from "@/components/ContentThumbCard";
import {
  columnExcerpt,
  firstImageSrc,
  formatColumnDate,
} from "@/lib/content/column-meta";
import { formatWorkPeriod } from "@/lib/content/work-filter";
import { firstMediaUrl } from "@/lib/content/og-image";
import { cn } from "@/lib/cn";
import { tagPillClass } from "@/lib/site/tag-styles";

type Props = {
  items: Work[];
  currentCategory?: string;
  currentTag?: string;
  /** 関連記事など、空のときにメッセージを出さない */
  hideEmpty?: boolean;
  /** 記事 og / image 未設定時のサムネフォールバック（カテゴリ OGP） */
  fallbackThumbSrc?: string | null;
};

function workThumbSrc(
  item: Work,
  fallbackThumbSrc?: string | null,
): string | null {
  return firstMediaUrl(
    item.image_url,
    item.og_image,
    fallbackThumbSrc,
    firstImageSrc(item.body_html),
  );
}

function workExcerpt(item: Work): string {
  const roleClient = [item.role, item.client].filter(Boolean).join(" / ");
  if (roleClient) return roleClient;
  return columnExcerpt(item.body_html, 120);
}

/**
 * Creative 一覧。枠なし。骨格は ContentThumbCard。
 */
export function WorkList({
  items,
  currentCategory,
  currentTag,
  hideEmpty,
  fallbackThumbSrc = null,
}: Props) {
  if (!items.length) {
    if (hideEmpty) return null;
    return (
      <p className="py-10 text-sm text-muted-foreground">
        条件に合う作品がありません。
      </p>
    );
  }

  return (
    <div className={contentPlainListClassName()} id="work-articles-list">
      {items.map((item, index) => {
        const href = `/works/creative/${item.slug}/`;
        const period =
          formatWorkPeriod(item.start_date, item.end_date) ||
          formatColumnDate(item.date);
        const category = item.work_category?.[0];
        const categoryLabel = category
          ? (WORK_CATEGORY_NAMES[category] ?? category)
          : null;
        const tags = [...(item.work_tag ?? [])].sort((a, b) =>
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
                thumbSrc={workThumbSrc(item, fallbackThumbSrc)}
                dateTime={item.start_date || item.date}
                dateLabel={period || undefined}
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
                excerpt={workExcerpt(item)}
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
