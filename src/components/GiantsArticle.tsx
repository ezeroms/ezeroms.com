import Link from "next/link";
import type { ShouldersOfGiants } from "@/types/content";
import { GiantsQuoteCard } from "@/components/GiantsQuoteCard";

type Props = {
  item: ShouldersOfGiants;
  /** Already sanitized body HTML */
  bodyHtml: string;
};

/**
 * The shoulders of Giants の個別詳細。
 * 一覧カードと同じ見た目＋書誌メタ（override がないとき）。
 */
export function GiantsArticle({ item, bodyHtml }: Props) {
  const showMeta =
    !item.citation_override?.trim() &&
    Boolean(
      item.book_title || item.author || item.publisher || item.published_year,
    );

  return (
    <div className="w-full font-sans text-foreground">
      <div id="notification" className="notification">
        リンクをコピーしました
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <GiantsQuoteCard
          item={item}
          bodyHtml={bodyHtml}
          linkCitationToDetail={false}
          className="mx-auto w-full max-w-3xl"
        />

        {showMeta ? (
          <dl className="mt-4 grid gap-1.5 px-1 text-base leading-relaxed text-foreground">
            {item.author ? (
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium">著者</dt>
                <dd className="m-0">{item.author}</dd>
              </div>
            ) : null}
            {item.book_title ? (
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium">書名</dt>
                <dd className="m-0">{item.book_title}</dd>
              </div>
            ) : null}
            {item.publisher ? (
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium">出版社</dt>
                <dd className="m-0">{item.publisher}</dd>
              </div>
            ) : null}
            {item.published_year ? (
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium">年</dt>
                <dd className="m-0">{item.published_year}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>

      <p className="mx-auto mt-6 max-w-3xl text-sm">
        <Link
          href="/shoulders-of-giants/"
          className="text-muted-foreground no-underline hover:text-foreground hover:underline"
        >
          ← The shoulders of Giants に戻る
        </Link>
      </p>
    </div>
  );
}
