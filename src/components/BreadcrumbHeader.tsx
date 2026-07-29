import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import type { BreadcrumbItem } from "@/lib/site/breadcrumbs";
import { BreadcrumbInfoButton } from "@/components/BreadcrumbInfoButton";
import { HeaderSearch } from "@/components/HeaderSearch";
import { cn } from "@/lib/cn";

type Props = {
  items: BreadcrumbItem[];
  /** 右端の検索を出す（デフォルト true） */
  showSearch?: boolean;
  className?: string;
  /**
   * 末尾クランブ（ギャラリー名）横の ? で出す説明。
   * 詳細ページや絞り込み階層があるときは渡さない。
   */
  infoDescription?: string | null;
  /** 検索モーダル内に出す絞り込みパネル */
  filterPanel?: ReactNode;
  /** 絞り込み適用中インジケーター */
  filterActive?: boolean;
};

function HeaderSearchFallback({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 min-[768px]:h-7 min-[768px]:w-16",
        className,
      )}
      aria-hidden
    />
  );
}

/**
 * Smile / Jampai 見出しと同トーンのパンくず行。
 * 左: パンくず / 右: 検索（＋条件フィルター）
 */
export function BreadcrumbHeader({
  items,
  showSearch = true,
  className,
  infoDescription,
  filterPanel,
  filterActive = false,
}: Props) {
  if (!items.length) return null;

  const infoText = infoDescription?.trim() || "";
  const lastIndex = items.length - 1;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-between gap-2 min-[768px]:gap-4",
        className,
      )}
    >
      <nav aria-label="パンくず" className="min-w-0 flex-1 overflow-hidden">
        <ol className="m-0 flex list-none flex-nowrap items-center gap-x-1.5 overflow-hidden p-0 font-sans text-sm font-medium tracking-wide text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === lastIndex;
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
                      "inline-flex min-w-0 max-w-full items-center gap-1",
                      isLast && "text-foreground/80",
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    <span className="truncate" title={item.label}>
                      {item.label}
                    </span>
                    {isLast && infoText ? (
                      <BreadcrumbInfoButton
                        description={infoText}
                        galleryLabel={item.label}
                      />
                    ) : null}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {showSearch ? (
        <Suspense fallback={<HeaderSearchFallback />}>
          <HeaderSearch
            filterPanel={filterPanel}
            filterActive={filterActive}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
