import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { contentCard } from "@/lib/site/card-styles";
import { OG_IMAGE_ASPECT_CLASS } from "@/lib/content/og-image";

const CARD_LINK_LAYOUT =
  "grid grid-cols-1 items-stretch gap-3 p-3 text-inherit no-underline min-[480px]:grid-cols-[minmax(0,38%)_minmax(0,1fr)] min-[480px]:gap-4 sm:grid-cols-[minmax(0,40%)_minmax(0,1fr)] sm:gap-5 sm:p-4";

const PLAIN_LINK_LAYOUT =
  "grid grid-cols-1 items-start gap-4 text-inherit no-underline min-[480px]:grid-cols-[minmax(0,34%)_minmax(0,1fr)] min-[480px]:gap-6 sm:grid-cols-[minmax(0,32%)_minmax(0,1fr)]";

/** 枠なし一覧で OGP（1200×630）を切らずに置く。横長なので画像列を広げる。 */
const PLAIN_OG_LINK_LAYOUT =
  "grid grid-cols-1 items-start gap-4 text-inherit no-underline min-[480px]:grid-cols-[minmax(0,44%)_minmax(0,1fr)] min-[480px]:gap-6 sm:grid-cols-[minmax(0,42%)_minmax(0,1fr)]";

type Props = {
  href: string;
  title: string;
  /** 左サムネ。無いときはプレースホルダグラデーション */
  thumbSrc: string | null;
  /** <time dateTime> 用（任意） */
  dateTime?: string | null;
  /** 日付の表示文字列 */
  dateLabel?: string;
  /** 日付の右に並べるメタ（カテゴリ・媒体名など） */
  metaSecondary?: ReactNode;
  excerpt?: string;
  /** false なら抜粋行を出さない（Clips） */
  showExcerpt?: boolean;
  /** 抜粋の行数（既定 2） */
  excerptLines?: 2 | 3;
  /** 抜粋の字サイズ・行間など（未指定は text-sm / leading-normal） */
  excerptClassName?: string;
  /** false なら見出しを出さず、日付＋抜粋だけにする（Diary 関連など） */
  showTitle?: boolean;
  /** false ならタイトルを折り返して全文表示（Clips） */
  clampTitle?: boolean;
  /** タイトル下のタグ列など */
  footer?: ReactNode;
  /** タグの下（Clips のメモなど） */
  note?: ReactNode;
  /** 最小高さを保ち、足りない分はタイトル下を伸ばす（Clips） */
  fillBelowTitle?: boolean;
  /**
   * card: 枠付き
   * plain: 枠なし。余白とサムネだけでまとまる（読み物一覧）
   */
  chrome?: "card" | "plain";
  /** 外部リンクなら true（target=_blank） */
  external?: boolean;
  /**
   * og: 1200×630 の枠でサムネを出す（Diary / Column Related など OGP 用）。
   * 未指定は従来どおり（一覧の stretch / 3:2）。
   */
  thumbAspect?: "og";
};

function EntryLink({
  href,
  external,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  href: string;
  external: boolean;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

/**
 * Column / Clips / Media coverage / Diary 関連 共通の一覧行。
 * 画像と日付・タイトル・抜粋が記事へ飛ぶ。タグ（footer）はカード内の別リンク。
 */
export function ContentThumbCard({
  href,
  title,
  thumbSrc,
  dateTime,
  dateLabel,
  metaSecondary,
  excerpt,
  showExcerpt = true,
  excerptLines = 2,
  excerptClassName,
  showTitle = true,
  clampTitle = true,
  footer,
  note,
  fillBelowTitle = false,
  chrome = "card",
  external = false,
  thumbAspect,
}: Props) {
  const plain = chrome === "plain";
  const ogThumb = thumbAspect === "og";
  const metaRow =
    dateLabel || metaSecondary ? (
      <div className="flex flex-wrap items-center gap-x-2 overflow-hidden text-sm leading-tight text-muted-foreground">
        {dateLabel && dateTime ? (
          <time dateTime={dateTime}>{dateLabel}</time>
        ) : dateLabel ? (
          <span>{dateLabel}</span>
        ) : null}
        {dateLabel && metaSecondary ? <span aria-hidden>·</span> : null}
        {metaSecondary}
      </div>
    ) : null;

  return (
    <article className={plain ? "min-w-0" : contentCard({ link: true })}>
      <div
        className={cn(
          plain
            ? ogThumb
              ? PLAIN_OG_LINK_LAYOUT
              : PLAIN_LINK_LAYOUT
            : CARD_LINK_LAYOUT,
          ogThumb && !plain && "min-[480px]:items-center",
        )}
      >
        <EntryLink
          href={href}
          external={external}
          aria-label={title}
          className={cn(
            "relative overflow-hidden bg-muted text-inherit no-underline",
            plain ? "rounded-md" : "rounded-lg",
            ogThumb
              ? cn(
                  "w-full self-start",
                  !plain && "min-[480px]:self-center",
                  OG_IMAGE_ASPECT_CLASS,
                )
              : cn(
                  "min-h-[11rem]",
                  !fillBelowTitle && !plain && "min-[480px]:min-h-0",
                  plain && "min-[480px]:min-h-0 min-[480px]:aspect-[3/2]",
                ),
          )}
        >
          {thumbSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbSrc}
              alt=""
              className="absolute inset-0 m-0 block h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-muted to-secondary/40"
              aria-hidden
            />
          )}
        </EntryLink>

        <div
          className={cn(
            "flex min-w-0 flex-col gap-2",
            plain
              ? "justify-start px-0 py-0"
              : "px-1 py-1 sm:gap-2.5 sm:px-2 sm:py-1",
            !plain && (clampTitle ? "overflow-hidden" : "overflow-x-hidden"),
            !plain &&
              (fillBelowTitle || note
                ? "h-full justify-start"
                : "justify-center"),
          )}
        >
          <EntryLink
            href={href}
            external={external}
            className="group flex min-w-0 flex-col gap-2 text-inherit no-underline"
          >
            {metaRow}

            {showTitle ? (
              <h2
                className={cn(
                  "m-0 font-semibold leading-normal tracking-tight text-foreground group-hover:underline group-hover:underline-offset-2",
                  plain ? "text-lg" : "text-base",
                  clampTitle && "line-clamp-2",
                )}
              >
                {title}
              </h2>
            ) : null}

            {showExcerpt ? (
              <p
                className={cn(
                  "m-0 text-muted-foreground",
                  excerptClassName ?? "text-sm leading-normal",
                  showTitle && "mt-1",
                  excerptLines === 3 ? "line-clamp-3" : "line-clamp-2",
                )}
              >
                {excerpt?.trim() ? excerpt : "\u00A0"}
              </p>
            ) : null}
          </EntryLink>

          {fillBelowTitle ? (
            <div className="min-h-0 flex-1" aria-hidden />
          ) : null}

          {footer ? (
            <div className="mt-3 flex flex-nowrap items-center gap-2 overflow-hidden">
              {footer}
            </div>
          ) : null}

          {note ? (
            <div className="mt-3 min-w-0 overflow-visible">{note}</div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** 枠なし一覧の外枠（余白で記事間を分ける） */
export function contentPlainListClassName(className?: string) {
  return cn("mx-auto flex w-full max-w-2xl flex-col gap-14 pt-8", className);
}

/** 一覧の外枠（中央寄せ・カード縦積み） */
export function contentThumbCardListClassName(className?: string) {
  return cn(
    "mx-auto flex w-full max-w-3xl flex-col gap-4 min-[768px]:gap-5 min-[1080px]:gap-6",
    className,
  );
}
