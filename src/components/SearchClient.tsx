"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ClipsMasonry } from "@/components/ClipsMasonry";
import { ColumnList } from "@/components/ColumnList";
import { ContentThumbCard, contentThumbCardListClassName } from "@/components/ContentThumbCard";
import { ExperienceDetail } from "@/components/experience/ExperienceDetail";
import { GiantsQuoteCard } from "@/components/GiantsQuoteCard";
import { MediaCoverageList } from "@/components/MediaCoverageList";
import { NotesTimeline } from "@/components/NotesTimeline";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { WorkList } from "@/components/WorkList";
import { applySearchResultFilters } from "@/lib/content/apply-search-result-filters";
import { formatColumnDate } from "@/lib/content/column-meta";
import {
  buildSearchHref,
  getSearchScope,
  isSearchScopeId,
  type SearchScopeId,
} from "@/lib/content/search-scope";
import { cn } from "@/lib/cn";
import type {
  Clip,
  Chronicle,
  Column,
  Diary,
  Experience,
  MediaCoverage,
  Photo,
  ShouldersOfGiants,
  Work,
} from "@/types/content";

type SearchGroup = {
  scope: SearchScopeId;
  label: string;
  records: Record<string, unknown>[];
};

type SearchResult = {
  query: string;
  scope: SearchScopeId;
  label?: string;
  groups: SearchGroup[];
};

type Props = {
  initialQuery?: string;
  initialScope?: SearchScopeId;
};

function SearchGroupResults({ group }: { group: SearchGroup }) {
  const { scope, records } = group;
  if (!records.length) return null;

  if (scope === "notes") {
    return (
      <NotesTimeline
        items={records as unknown as Diary[]}
        hideEmpty
        showNotification={false}
      />
    );
  }
  if (scope === "column") {
    return <ColumnList items={records as unknown as Column[]} hideEmpty />;
  }
  if (scope === "smile" || scope === "jumpai" || scope === "tabekake") {
    return (
      <PhotoGallery
        items={records as unknown as Photo[]}
        desktopColumns={3}
        galleryId={scope}
      />
    );
  }
  if (scope === "creative") {
    return <WorkList items={records as unknown as Work[]} />;
  }
  if (scope === "experience") {
    return (
      <div className="flex flex-col gap-4">
        {(records as unknown as Experience[]).map((item) => (
          <ExperienceDetail key={item.id ?? item.slug} item={item} />
        ))}
      </div>
    );
  }
  if (scope === "clips") {
    return <ClipsMasonry items={records as unknown as Clip[]} />;
  }
  if (scope === "giants") {
    return (
      <div className="flex flex-col gap-6">
        {(records as unknown as ShouldersOfGiants[]).map((item) => (
          <GiantsQuoteCard key={item.id ?? item.slug} item={item} />
        ))}
      </div>
    );
  }
  if (scope === "media-coverage") {
    return (
      <MediaCoverageList items={records as unknown as MediaCoverage[]} />
    );
  }
  if (scope === "chronicle") {
    const items = records as unknown as Chronicle[];
    return (
      <div className={contentThumbCardListClassName()}>
        {items.map((item) => (
          <ContentThumbCard
            key={item.id ?? item.slug}
            href={`/chronicle/${item.slug}/`}
            title={item.title}
            thumbSrc={null}
            dateTime={item.date}
            dateLabel={formatColumnDate(item.date)}
            excerpt={(item.description ?? "").trim() || undefined}
          />
        ))}
      </div>
    );
  }

  return null;
}

function readFilterQsFromLocation(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  params.delete("q");
  params.delete("scope");
  return params.toString();
}

function buildSearchHrefKeepingFilters(
  scope: SearchScopeId,
  query: string,
  filterQs: string,
): string {
  const href = buildSearchHref(scope, query);
  if (!filterQs) return href;
  return href.includes("?") ? `${href}&${filterQs}` : `${href}?${filterQs}`;
}

export function SearchClient({
  initialQuery = "",
  initialScope = "all",
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [filterQs, setFilterQs] = useState("");
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scope = isSearchScopeId(initialScope) ? initialScope : "all";
  const scopeLabel = getSearchScope(scope).label;

  useEffect(() => {
    setFilterQs(readFilterQsFromLocation());
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // アドレスバーを `/section/search/?q=` に同期（絞り込みクエリは維持）
  useEffect(() => {
    const href = buildSearchHrefKeepingFilters(scope, query, filterQs);
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === href) return;
    router.replace(href, { scroll: false });
  }, [query, scope, router, filterQs]);

  useEffect(() => {
    if (!query.trim()) {
      setData(null);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          scope,
        });
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        setData((await response.json()) as SearchResult);
      } catch (error) {
        if ((error as Error).name !== "AbortError") console.error(error);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, scope]);

  const groups = useMemo(() => {
    const raw = data?.groups ?? [];
    return raw
      .map((group) => ({
        ...group,
        records: applySearchResultFilters(
          group.scope,
          group.records,
          filterQs,
        ),
      }))
      .filter((g) => g.records.length);
  }, [data, filterQs]);
  const showEmpty = Boolean(data && !loading && !groups.length);

  return (
    <div className="mx-auto w-full max-w-3xl font-sans text-foreground">
      <p className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {scope === "all" ? "Search" : `Search in ${scopeLabel}`}
      </p>

      <div className="relative">
        <label className="block">
          <span className="sr-only">検索キーワード</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="キーワードを入力…"
            autoFocus
            className={cn(
              "h-10 w-full border-0 border-b border-border bg-transparent",
              "py-0 pl-0 pr-9 text-base text-foreground outline-none",
              "placeholder:text-muted-foreground/60 focus:border-foreground",
              // Hide native clear (WebKit / Chromium)
              "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
              // Firefox
              "[&::-moz-search-clear-button]:hidden",
            )}
          />
        </label>
        {query ? (
          <button
            type="button"
            className={cn(
              "absolute right-0 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center",
              "appearance-none border-0 bg-transparent p-0 shadow-none",
              "text-muted-foreground transition-colors hover:text-foreground",
            )}
            aria-label="入力をクリア"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">検索中…</p>
      ) : null}

      {showEmpty ? (
        <p className="mt-8 m-0 text-sm text-muted-foreground">
          該当する結果はありません。
        </p>
      ) : null}

      {groups.length > 0 && !loading ? (
        <div className="mt-8 space-y-10">
          {groups.map((group) => (
            <section key={group.scope} aria-label={group.label}>
              {scope === "all" ? (
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h2>
              ) : null}
              <SearchGroupResults group={group} />
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
