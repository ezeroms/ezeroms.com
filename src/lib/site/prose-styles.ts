import { cn } from "@/lib/cn";

/**
 * 本文中リンク:
 * - 下線は常時表示（色は文字色に追従）
 * - 文字は少し薄く、ホバーで本文色に戻る
 *
 * レガシー `a:link { text-decoration: none }` 対策で underline に `!` を使う。
 */
export const proseBodyLinkClass =
  "[&_a]:!text-muted-foreground [&_a]:!underline [&_a]:underline-offset-2 [&_a]:decoration-current [&_a]:transition-colors hover:[&_a]:!text-foreground";

/**
 * 本文中リスト（見た目は app.css の .prose-body で制御）。
 * markdown 由来の li > p は inline にして改行を防ぐ。
 */
export const proseBodyListClass = "[&_li>p]:m-0 [&_li>p]:inline";

/** 本文（リンク＋リスト）共通 */
export const proseBodyClass = `prose-body ${proseBodyLinkClass} ${proseBodyListClass}`;

/**
 * 引用ブロック: イタリック・サブテキスト色・左縦線。
 * Diary / Column ほか articleBodyClass 経由で共通適用。
 *
 * preflight 無効のため border-style と UA の blockquote margin を明示的に打ち消す。
 */
export const proseBlockquoteClass =
  "[&_blockquote]:my-4 [&_blockquote]:mx-0 [&_blockquote]:border-0 [&_blockquote]:border-l-[3px] [&_blockquote]:border-solid [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground";

/** 詳細本文の h2 / h3（Column / Work / About）。 */
export const articleHeadingClass = cn(
  "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:scroll-mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight",
  "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:scroll-mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-tight",
);

/** 詳細本文の figure / figcaption。画像は本文幅いっぱいに広げる。 */
export const articleFigureClass = cn(
  "[&_figure]:my-6 [&_figure]:mx-0 [&_figure]:w-full",
  "[&_figure_img]:mt-0 [&_figure_img]:block [&_figure_img]:w-full",
  "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:leading-relaxed [&_figcaption]:text-muted-foreground",
);

/** 詳細本文のインライン code（見出し付き記事向け）。 */
export const articleInlineCodeClass =
  "[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.9em]";

/** Column / Work 詳細の本文クロム（見出し・コード・図版）。 */
export const articleDetailClass = cn(
  articleHeadingClass,
  articleInlineCodeClass,
  articleFigureClass,
);

/**
 * 本文と同じ字サイズ・行間。
 * SP（≤1079）15px / PC（≥1080）16px、行間 1.8。`.article-prose` で overrides と揃える。
 */
export const articleTypeClass =
  "article-prose min-w-0 text-[0.9375rem] leading-[1.8] text-foreground min-[1080px]:text-base";

/**
 * Diary 一覧 / 詳細と同じ本文クロム（段落間隔・画像・区切り線＝余白）。
 * Column 詳細などでもこれをベースにする。
 */
export const articleBodyClass = cn(
  articleTypeClass,
  "overflow-hidden",
  proseBodyClass,
  proseBlockquoteClass,
  "[&_img]:mt-4 [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:max-w-full [&_img]:rounded-lg",
  "[&_video]:mt-4 [&_video]:block [&_video]:w-full [&_video]:max-w-full [&_video]:rounded-lg [&_video]:bg-black",
  articleFigureClass,
  "[&_p]:m-0 [&_p+p]:mt-3",
  // 空行スペーサーは段落マージンを付けず、1行分の高さだけ空ける
  "[&_p.rt-blank]:my-0 [&_p.rt-blank]:h-[1.8em] [&_p.rt-blank]:overflow-hidden",
  "[&_p:has(+p.rt-blank)]:mb-0 [&_p.rt-blank+p]:mt-0",
  "[&_hr]:my-4 [&_hr]:h-0 [&_hr]:border-0 [&_hr]:bg-transparent",
);

/** 一覧末尾の続き案内。見た目は `.listing-more`（legacy CSS）。 */
export const listingMoreClass = "listing-more mx-auto max-w-2xl pb-8";
