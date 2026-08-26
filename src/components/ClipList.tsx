import { PenLine } from "lucide-react";
import type { Clip } from "@/types/content";
import {
  ContentThumbCard,
  contentThumbCardListClassName,
} from "@/components/ContentThumbCard";
import {
  clipSourceLabel,
  clipThumbSrc,
  formatClipDate,
} from "@/lib/content/clip-meta";
import { tagChipClass } from "@/lib/site/tag-styles";

type Props = {
  items: Clip[];
  currentTag?: string | null;
  hideEmpty?: boolean;
  fallbackThumbSrc?: string | null;
};

function ClipMemo({ children }: { children: string }) {
  return (
    <div className="pt-2">
      <div className="h-px bg-border" aria-hidden />
      <div className="flex items-start gap-2 pt-3.5">
        <PenLine
          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <p className="m-0 min-w-0 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
          <span className="sr-only">メモ: </span>
          {children}
        </p>
      </div>
    </div>
  );
}

/**
 * Clips 一覧。Column / Creative と同じ ContentThumbCard。
 * 自分のメモは右カラム末尾の注釈。左のサムネはその高さに合わせて伸びる。
 */
export function ClipList({
  items,
  currentTag = null,
  hideEmpty,
  fallbackThumbSrc = null,
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
    <div
      className={contentThumbCardListClassName("pb-20 min-[1080px]:pb-0")}
      id="clips-list"
    >
      {items.map((item) => {
        const tags = [...(item.clip_tag ?? [])].sort((a, b) =>
          a.localeCompare(b, "ja"),
        );
        const memo = item.memo?.trim() ?? "";

        return (
          <ContentThumbCard
            key={item.id}
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
            fillBelowTitle
            footer={
              tags.length
                ? tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className={tagChipClass(currentTag === tag)}
                    >
                      {tag}
                    </span>
                  ))
                : null
            }
            note={memo ? <ClipMemo>{memo}</ClipMemo> : null}
          />
        );
      })}
    </div>
  );
}
