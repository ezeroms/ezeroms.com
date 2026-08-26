import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { contentCard } from "@/lib/site/card-styles";

const CARD_LINK_LAYOUT =
  "grid grid-cols-1 items-stretch text-inherit no-underline min-[480px]:grid-cols-[minmax(0,38%)_minmax(0,1fr)] sm:grid-cols-[minmax(0,40%)_minmax(0,1fr)]";

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
  /** タイトル下〜抜粋の下（タグ列など） */
  footer?: ReactNode;
  /** 右カラム末尾の注釈（Clips のメモ）。グリッド内なので左画像も同じ高さになる */
  note?: ReactNode;
  /** 最小高さを保ち、足りない分はタイトル下を伸ばす（Clips） */
  fillBelowTitle?: boolean;
  /** 外部リンクなら true（target=_blank） */
  external?: boolean;
};

/**
 * Column / Media coverage 共通の一覧カード。
 * 左: 端まで隙間なしのサムネ、右: 日付・タイトル・抜粋。
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
  external = false,
}: Props) {
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

  const body = (
    <>
      <div
        className={cn(
          "relative min-h-[11rem] overflow-hidden bg-muted",
          !fillBelowTitle && "min-[480px]:min-h-0",
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
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-col gap-2 px-4 py-4 sm:gap-2.5 sm:px-6 sm:py-5",
          clampTitle ? "overflow-hidden" : "overflow-x-hidden",
          fillBelowTitle || note ? "h-full justify-start" : "justify-center",
        )}
      >
        {metaRow}

        <h2
          className={cn(
            "m-0 text-base font-semibold leading-normal tracking-tight text-foreground",
            clampTitle && "line-clamp-2",
          )}
        >
          <span className="hover:underline hover:underline-offset-2">
            {title}
          </span>
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
          <div className="flex flex-nowrap items-center gap-2 overflow-hidden">
            {footer}
          </div>
        ) : null}

        {note}
      </div>
    </>
  );

  return (
    <article className={contentCard({ link: true })}>
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={CARD_LINK_LAYOUT}
        >
          {body}
        </a>
      ) : (
        <Link href={href} className={CARD_LINK_LAYOUT}>
          {body}
        </Link>
      )}
    </article>
  );
}

/** 一覧の外枠（中央寄せ・カード縦積み） */
export function contentThumbCardListClassName(className?: string) {
  return cn(
    "mx-auto flex w-full max-w-3xl flex-col gap-4 min-[768px]:gap-5 min-[1080px]:gap-6",
    className,
  );
}
