import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/site/breadcrumbs";
import { HeaderSearch } from "@/components/HeaderSearch";
import { cn } from "@/lib/cn";

type Props = {
  items: BreadcrumbItem[];
  /** 右端の検索を出す（デフォルト true） */
  showSearch?: boolean;
  className?: string;
};

/**
 * Smile / Jampai 見出しと同トーンのパンくず行。
 * 左: パンくず / 右: 控えめな検索窓
 */
export function BreadcrumbHeader({
  items,
  showSearch = true,
  className,
}: Props) {
  if (!items.length) return null;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-between gap-4",
        className,
      )}
    >
      <nav aria-label="パンくず" className="min-w-0 flex-1 overflow-hidden">
        <ol className="m-0 flex list-none flex-nowrap items-center gap-x-1.5 overflow-hidden p-0 font-sans text-sm font-medium tracking-wide text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li
                key={`${item.label}-${index}`}
                className={cn(
                  "flex min-w-0 items-center gap-x-1.5",
                  isLast && "shrink truncate",
                  !isLast && "shrink-0",
                )}
              >
                {index > 0 ? (
                  <span className="shrink-0 text-muted-foreground/45" aria-hidden>
                    /
                  </span>
                ) : null}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="shrink-0 text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate",
                      isLast && "text-foreground/80",
                    )}
                    aria-current={isLast ? "page" : undefined}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {showSearch ? <HeaderSearch /> : null}
    </div>
  );
}
