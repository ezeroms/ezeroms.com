/**
 * ライトボックス対象画像のホバー（Photos と Diary / Column 本文で共通）。
 * カーソルは pointer、ホバーで少し透過。
 */
export const lightboxPreviewClass =
  "cursor-pointer transition-opacity duration-200 ease-out hover:opacity-80";

/**
 * 記事 HTML 内の img 向け。親要素に付ける。
 * hover は `[&_img]:hover:` だと親ホバーで全画像が反応するので、
 * `[&_img:hover]:` で当該 img だけにする。
 */
export const lightboxPreviewInProseClass =
  "[&_img]:cursor-pointer [&_img]:transition-opacity [&_img]:duration-200 [&_img]:ease-out [&_img:hover]:opacity-80 [&_.code-block_img]:cursor-auto [&_.code-block_img:hover]:opacity-100";
