import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { contentCard } from "@/lib/site/card-styles";

const CARD_LINK_LAYOUT =
  "grid grid-cols-1 items-stretch text-inherit no-underline min-[480px]:grid-cols-[minmax(0,38%)_minmax(0,1fr)] sm:grid-cols-[minmax(0,40%)_minmax(0,1fr)]";

const PLAIN_LINK_LAYOUT =
  "grid grid-cols-1 items-start gap-4 text-inherit no-underline min-[480px]:grid-cols-[minmax(0,34%)_minmax(0,1fr)] min-[480px]:gap-6 sm:grid-cols-[minmax(0,32%)_minmax(0,1fr)]";

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
 * Column / Clips / Media coverage 共通の一覧行。
 * カード全体はリンクにしない。タイトルと画像だけ記事へ飛ぶ。
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
  clampTitle = true,
  footer,
  note,
  fillBelowTitle = false,
  chrome = "card",
  external = false,
}: Props) {
  const plain = chrome === "plain";
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
    <article className={plain ? "min-w-0" : contentCard()}>
      <div className={plain ? PLAIN_LINK_LAYOUT : CARD_LINK_LAYOUT}>
        <EntryLink
          href={href}
          external={external}
          aria-label={title}
          className={cn(
            "relative min-h-[11rem] overflow-hidden bg-muted text-inherit no-underline",
            plain && "rounded-md",
            !fillBelowTitle && !plain && "min-[480px]:min-h-0",
            plain && "min-[480px]:min-h-0 min-[480px]:aspect-[3/2]",
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
              : "px-4 py-4 sm:gap-2.5 sm:px-6 sm:py-5",
            !plain && (clampTitle ? "overflow-hidden" : "overflow-x-hidden"),
            !plain &&
              (fillBelowTitle || note
                ? "h-full justify-start"
                : "justify-center"),
          )}
        >
          {metaRow}

          <h2
            className={cn(
              "m-0 font-semibold leading-normal tracking-tight text-foreground",
              plain ? "text-lg" : "text-base",
              clampTitle && "line-clamp-2",
            )}
          >
            <EntryLink
              href={href}
              external={external}
              className="text-inherit no-underline hover:underline hover:underline-offset-2"
            >
              {title}
            </EntryLink>
          </h2>

          {showExcerpt ? (
            <p className="m-0 mt-1 line-clamp-2 text-sm leading-normal text-muted-foreground">
              {excerpt?.trim() ? excerpt : "\u00A0"}
            </p>
          ) : null}

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

/** 枠なし一覧の外枠（余白と仕切り線でまとめる） */
export function contentPlainListClassName(className?: string) {
  return cn("mx-auto flex w-full max-w-2xl flex-col", className);
}

/** 一覧の外枠（中央寄せ・カード縦積み） */
export function contentThumbCardListClassName(className?: string) {
  return cn(
    "mx-auto flex w-full max-w-3xl flex-col gap-4 min-[768px]:gap-5 min-[1080px]:gap-6",
    className,
  );
}
