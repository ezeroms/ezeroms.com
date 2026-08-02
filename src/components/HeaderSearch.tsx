"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  buildSearchHref,
  resolveSearchScope,
} from "@/lib/content/search-scope";
import {
  SearchFilterProvider,
  useSearchFilterHost,
} from "@/components/filter/SearchFilterContext";

type Props = {
  className?: string;
  /** セクション用の絞り込み UI（キーワードと一体で検索する） */
  filterPanel?: ReactNode;
  /** 絞り込み適用中のとき、トリガーにインジケーターを出す */
  filterActive?: boolean;
};

function mergeHrefWithFilterQs(href: string, filterQs: string): string {
  const raw = filterQs.startsWith("?") ? filterQs.slice(1) : filterQs;
  if (!raw) return href;
  return href.includes("?") ? `${href}&${raw}` : `${href}?${raw}`;
}

function HeaderSearchInner({
  className,
  filterPanel = null,
  filterActive = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const scope = resolveSearchScope(pathname);
  const { api: filterApi } = useSearchFilterHost();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [filterTick, setFilterTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const locationWhenOpened = useRef<string | null>(null);
  const titleId = useId();
  const hasFilter = Boolean(filterPanel);

  const locationKey = `${pathname}?${searchParams?.toString() ?? ""}`;

  const filterDraftActive = useMemo(() => {
    void filterTick;
    return Boolean(filterApi?.isActive());
  }, [filterApi, filterTick]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      locationWhenOpened.current = null;
      return;
    }

    if (locationWhenOpened.current == null) {
      locationWhenOpened.current = locationKey;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, locationKey]);

  // モーダル表示後に検索窓へフォーカス（ポータル描画後に当てる）
  useEffect(() => {
    if (!open || !mounted) return;

    let cancelled = false;
    let timeoutId = 0;

    const focusInput = () => {
      if (cancelled) return;
      const input = inputRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      if (input.value) input.select();
    };

    const raf = window.requestAnimationFrame(() => {
      focusInput();
      timeoutId = window.setTimeout(focusInput, 0);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeoutId);
    };
  }, [open, mounted]);

  // 検索適用などで URL が変わったらモーダルを閉じる
  useEffect(() => {
    if (!open || locationWhenOpened.current == null) return;
    if (locationKey !== locationWhenOpened.current) {
      setOpen(false);
    }
  }, [locationKey, open]);

  function close() {
    setOpen(false);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    const filterQs = filterApi?.getQueryString() ?? "";
    const basePath = filterApi?.getBasePath();
    const canSearch = Boolean(trimmed) || Boolean(filterApi?.isActive());
    if (!canSearch) return;

    close();

    if (trimmed) {
      router.push(
        mergeHrefWithFilterQs(buildSearchHref(scope.id, trimmed), filterQs),
      );
      return;
    }

    if (basePath) {
      router.push(`${basePath}${filterQs}`);
      return;
    }

    router.push(buildSearchHref(scope.id));
  }

  const canSearch =
    Boolean(query.trim()) || filterDraftActive;

  const modalTitle =
    scope.id === "all" ? "Search" : `Search in ${scope.label}`;

  return (
    <>
      <button
        type="button"
        className={cn(
          "relative inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5",
          "appearance-none border-0 bg-transparent p-0 shadow-none outline-none",
          "text-foreground hover:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "min-[768px]:h-7 min-[768px]:w-auto",
          className,
        )}
        aria-label={
          filterActive ? "検索を開く（条件適用中）" : "検索を開く"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Search
          className="h-5 w-5 shrink-0 min-[1080px]:h-3.5 min-[1080px]:w-3.5"
          strokeWidth={2}
          aria-hidden
        />
        <span className="hidden text-sm min-[768px]:inline">Search</span>
        {filterActive ? (
          <span
            className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-foreground min-[768px]:right-[-2px] min-[768px]:top-0"
            aria-hidden
          />
        ) : null}
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[8vh] sm:p-6 sm:pt-[10vh]"
              role="presentation"
            >
              <button
                type="button"
                aria-label="閉じる"
                className="absolute inset-0 m-0 cursor-default border-0 p-0"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
                onClick={close}
              />

              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                  "relative z-10 flex w-full flex-col overflow-hidden rounded-lg border border-border bg-background",
                  "font-sans text-foreground shadow-none",
                  hasFilter
                    ? "max-h-[min(88dvh,42rem)] max-w-md p-5 sm:max-w-lg sm:p-6"
                    : "max-w-lg p-5 sm:p-6",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent",
                    "appearance-none text-muted-foreground shadow-none transition-colors hover:bg-accent hover:text-foreground",
                  )}
                  aria-label="閉じる"
                  onClick={close}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>

                <h2
                  id={titleId}
                  className="m-0 shrink-0 pr-8 text-lg font-semibold tracking-wide"
                >
                  {modalTitle}
                </h2>

                <form
                  role="search"
                  onSubmit={onSubmit}
                  className="mt-4 flex min-h-0 flex-1 flex-col"
                >
                  <label className="block shrink-0">
                    <span className="sr-only">検索キーワード</span>
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70"
                        aria-hidden
                      />
                      <input
                        ref={inputRef}
                        type="search"
                        name="q"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={`${scope.label} 内を検索…`}
                        autoComplete="off"
                        autoFocus
                        enterKeyHint="search"
                        className={cn(
                          "h-11 w-full appearance-none rounded-md border border-transparent bg-muted",
                          "pl-9 pr-3 text-base text-foreground shadow-none outline-none",
                          "placeholder:text-muted-foreground/60",
                          "focus-visible:border-foreground/25",
                        )}
                      />
                    </div>
                  </label>

                  {hasFilter ? (
                    <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
                      <div
                        className="space-y-5"
                        onChangeCapture={() =>
                          setFilterTick((n) => n + 1)
                        }
                        onClickCapture={() =>
                          setFilterTick((n) => n + 1)
                        }
                      >
                        {filterPanel}
                      </div>
                      {filterDraftActive ? (
                        <button
                          type="button"
                          className={cn(
                            "mt-4 border-0 bg-transparent p-0 text-sm text-muted-foreground",
                            "underline-offset-2 hover:text-foreground hover:underline",
                          )}
                          onClick={() => {
                            filterApi?.clearDraft();
                            setFilterTick((n) => n + 1);
                          }}
                        >
                          すべて解除
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-5 flex shrink-0 justify-end gap-2">
                    <button
                      type="button"
                      onClick={close}
                      className={cn(
                        "inline-flex h-9 items-center justify-center rounded-md border-0 bg-transparent px-3",
                        "appearance-none text-sm text-muted-foreground shadow-none",
                        "transition-colors hover:bg-accent hover:text-foreground",
                      )}
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={!canSearch}
                      className={cn(
                        "inline-flex h-9 items-center justify-center rounded-md border-0 bg-foreground px-4",
                        "appearance-none text-sm font-medium text-background shadow-none",
                        "transition-opacity hover:opacity-80",
                        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40",
                      )}
                    >
                      検索
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/**
 * ヘッダー右端の検索トリガー。
 * キーワードと絞り込みを一つの検索として扱う。
 */
export function HeaderSearch(props: Props) {
  return (
    <SearchFilterProvider>
      <HeaderSearchInner {...props} />
    </SearchFilterProvider>
  );
}
