import type { Clip } from "@/types/content";
import Link from "next/link";
import { PenLine } from "lucide-react";
import {
  ContentThumbCard,
  contentPlainListClassName,
} from "@/components/ContentThumbCard";
import {
  clipListingHref,
  clipSourceLabel,
  clipThumbSrc,
  formatClipDate,
} from "@/lib/content/clip-meta";
import type { DiaryFilterState } from "@/lib/content/diary-filter";
import { tagPillClass } from "@/lib/site/tag-styles";

type Props = {
  items: Clip[];
  currentTag?: string | null;
  hideEmpty?: boolean;
  fallbackThumbSrc?: string | null;
  dateFilter?: Pick<DiaryFilterState, "from" | "to">;
};

function ClipMemo({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-solid border-border px-3 py-2.5">
      <PenLine
        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <p className="m-0 min-w-0 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
        <span className="sr-only">メモ: </span>
        {children}
      </p>
    </div>
  );
}

/**
 * Clips 一覧。Column と同じ枠なし行。
 */
export function ClipList({
  items,
  currentTag = null,
  hideEmpty,
  fallbackThumbSrc = null,
  dateFilter,
}: Props) {
  if (!items.length) {
    if (hideEmpty) return null;
    return (
      <p className="py-10 text-sm text-muted-foreground">
        条件に合うクリップがありません。
      </p>
    );
  }

  return (
    <div className={contentPlainListClassName()} id="clips-list">
      {items.map((item, index) => {
        const tags = [...(item.clip_tag ?? [])].sort((a, b) =>
          a.localeCompare(b, "ja"),
        );
        const memo = item.memo?.trim() ?? "";

        return (
          <div key={item.id}>
            {index > 0 ? (
              <div className="h-px bg-border-subtle" aria-hidden />
            ) : null}
            <div className="py-7">
              <ContentThumbCard
                href={item.source_url}
                external
                title={item.title}
                thumbSrc={clipThumbSrc(item, fallbackThumbSrc)}
                dateTime={item.date}
                dateLabel={formatClipDate(item.date)}
                metaSecondary={
                  <span className="truncate">
                    {clipSourceLabel(item.source_url, item.source_name)}
                  </span>
                }
                showExcerpt={false}
                clampTitle={false}
                footer={
                  tags.length
                    ? tags.slice(0, 4).map((tag) => {
                        const active = currentTag === tag;
                        return (
                          <Link
                            key={tag}
                            href={
                              active
                                ? clipListingHref({
                                    from: dateFilter?.from,
                                    to: dateFilter?.to,
                                  })
                                : clipListingHref({
                                    tag,
                                    from: dateFilter?.from,
                                    to: dateFilter?.to,
                                  })
                            }
                            className={tagPillClass(active)}
                          >
                            {tag}
                          </Link>
                        );
                      })
                    : null
                }
                note={memo ? <ClipMemo>{memo}</ClipMemo> : null}
                chrome="plain"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
