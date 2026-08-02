import type { MediaCoverage } from "@/types/content";
import {
  ContentThumbCard,
  contentThumbCardListClassName,
} from "@/components/ContentThumbCard";
import {
  columnExcerpt,
  firstImageSrc,
  formatColumnDate,
} from "@/lib/content/column-meta";

import { firstMediaUrl } from "@/lib/content/og-image";

type Props = {
  items: MediaCoverage[];
  fallbackThumbSrc?: string | null;
};

function mediaCoverageThumbSrc(
  item: MediaCoverage,
  fallbackThumbSrc?: string | null,
): string | null {
  return firstMediaUrl(
    item.og_image,
    fallbackThumbSrc,
    firstImageSrc(item.body_html ?? ""),
  );
}

/**
 * Media coverage 一覧。
 * Column と同じ ContentThumbCard レイアウトを使う。
 */
export function MediaCoverageList({
  items,
  fallbackThumbSrc = null,
}: Props) {
  if (!items.length) {
    return (
      <p className="py-10 text-sm text-muted-foreground">
        まだ掲載がありません。
      </p>
    );
  }

  return (
    <div
      className={contentThumbCardListClassName()}
      id="media-coverage-list"
    >
      {items.map((item) => {
        const isExternal = Boolean(item.external_url?.trim());
        const href = isExternal
          ? item.external_url!
          : `/about/media-coverage/${item.slug}/`;
        const excerpt = columnExcerpt(item.body_html ?? "", 120);
        const lead = (item.lead ?? "").trim();
        const dateLabel = item.date ? formatColumnDate(item.date) : "";

        return (
          <ContentThumbCard
            key={item.id}
            href={href}
            title={item.title}
            thumbSrc={mediaCoverageThumbSrc(item, fallbackThumbSrc)}
            dateTime={item.date}
            dateLabel={dateLabel}
            metaSecondary={lead ? <span>{lead}</span> : null}
            excerpt={
              excerpt || (isExternal ? "外部記事を見る →" : undefined)
            }
            external={isExternal}
          />
        );
      })}
    </div>
  );
}
