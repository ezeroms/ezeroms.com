import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { contentCard } from "@/lib/site/card-styles";
import { cn } from "@/lib/cn";

export type ArticleNavItem = {
  href: string;
  title: string;
};

type Props = {
  previous?: ArticleNavItem | null;
  next?: ArticleNavItem | null;
  className?: string;
};

function NavCard({
  href,
  label,
  title,
  icon,
}: {
  href: string;
  label: string;
  title: string;
  icon: "prev" | "next";
}) {
  return (
    <Link
      href={href}
      className={contentCard({
        link: true,
        className:
          "flex w-full items-center gap-3 px-5 py-4 text-inherit no-underline sm:px-6 sm:py-5",
      })}
    >
      {icon === "prev" ? (
        <ChevronLeft
          className="h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-muted-foreground">{label}</span>
        <span className="mt-0.5 line-clamp-2 block text-base leading-snug text-foreground">
          {title}
        </span>
      </span>
      {icon === "next" ? (
        <ChevronRight
          className="h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

/**
 * 記事詳細の前後ナビ（積み上げカード）。
 * 前の記事 = より古い / 次の記事 = より新しい。
 */
export function ArticleNavigation({ previous, next, className }: Props) {
  if (!previous && !next) return null;

  return (
    <nav
      className={cn(
        "mx-auto mt-10 flex w-full max-w-3xl flex-col gap-3",
        className,
      )}
      aria-label="前後の記事"
    >
      {previous ? (
        <NavCard
          href={previous.href}
          label="前の記事"
          title={previous.title}
          icon="prev"
        />
      ) : null}
      {next ? (
        <NavCard
          href={next.href}
          label="次の記事"
          title={next.title}
          icon="next"
        />
      ) : null}
    </nav>
  );
}
