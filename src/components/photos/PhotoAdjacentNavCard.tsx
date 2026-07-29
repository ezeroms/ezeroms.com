import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { photoGridSrc } from "@/lib/content/photo-caption";
import { contentCard } from "@/lib/site/card-styles";
import type { Photo } from "@/types/content";

type Direction = "older" | "newer";

type Props = {
  href: string | null;
  direction: Direction;
  photo: Photo | null;
  ariaLabel: string;
};

/**
 * 詳細ページ右側の前後ナビカード。
 * older: 左シェブロン + サムネ / newer: サムネ + 右シェブロン
 */
export function PhotoAdjacentNavCard({
  href,
  direction,
  photo,
  ariaLabel,
}: Props) {
  const thumbnailSrc = photo ? photoGridSrc(photo) : null;
  const isEnabled = Boolean(href && photo && thumbnailSrc);

  const chevronIcon =
    direction === "older" ? (
      <ChevronLeft
        className="h-4 w-4 shrink-0"
        strokeWidth={1.75}
        aria-hidden
      />
    ) : (
      <ChevronRight
        className="h-4 w-4 shrink-0"
        strokeWidth={1.75}
        aria-hidden
      />
    );

  const thumbnail = (
    <span className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
      {thumbnailSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailSrc}
          alt=""
          className="absolute inset-0 m-0 h-full w-full object-cover"
        />
      ) : null}
    </span>
  );

  const className = contentCard({
    link: isEnabled,
    className: cn(
      "grid w-full items-center gap-2 p-2 no-underline",
      direction === "older"
        ? "grid-cols-[auto_minmax(0,1fr)]"
        : "grid-cols-[minmax(0,1fr)_auto]",
      "text-muted-foreground transition-colors",
      isEnabled
        ? "hover:text-foreground"
        : "pointer-events-none opacity-40",
    ),
  });

  const body =
    direction === "older" ? (
      <>
        {chevronIcon}
        {thumbnail}
      </>
    ) : (
      <>
        {thumbnail}
        {chevronIcon}
      </>
    );

  if (!isEnabled || !href) {
    return (
      <div className={className} aria-hidden>
        {body}
      </div>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {body}
    </Link>
  );
}
