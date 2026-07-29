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
 * Notes 一覧 / 詳細と同じ本文クロム（段落間隔・画像・区切り線＝余白）。
 * Column 詳細などでもこれをベースにする。
 */
export const notesBodyClass = cn(
  "notes-feed__body min-w-0 overflow-hidden text-[0.9375rem] leading-[1.8] text-foreground min-[1080px]:text-base",
  proseBodyClass,
  "[&_img]:mt-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg",
  "[&_p]:m-0 [&_p+p]:mt-3",
  "[&_hr]:my-4 [&_hr]:h-0 [&_hr]:border-0 [&_hr]:bg-transparent",
);
