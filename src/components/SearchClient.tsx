"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SearchResult = {
  query: string;
  diary: { slug: string; date: string }[];
  column: { slug: string; title: string }[];
  chronicle: { slug: string; title: string; date: string }[];
  work: { slug: string; title: string }[];
};

type Props = {
  initialQuery?: string;
};

export function SearchClient({ initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

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
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
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
  }, [query]);

  return (
    <div className="mx-auto max-w-2xl font-sans text-foreground">
      <label className="block">
        <span className="sr-only">検索キーワード</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="キーワードを入力…"
          autoFocus
          className="h-10 w-full border-0 border-b border-border bg-transparent px-0 text-base text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-foreground"
        />
      </label>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">検索中…</p>
      ) : null}

      {data ? (
        <div className="mt-8 space-y-8">
          <SearchSection title="Notes">
            {data.diary.map((item) => (
              <li key={item.slug}>
                <Link href={`/diary/${item.slug}/`}>{item.date}</Link>
              </li>
            ))}
          </SearchSection>
          <SearchSection title="Column">
            {data.column.map((item) => (
              <li key={item.slug}>
                <Link href={`/column/${item.slug}/`}>{item.title}</Link>
              </li>
            ))}
          </SearchSection>
          <SearchSection title="Chronicle">
            {data.chronicle.map((item) => (
              <li key={item.slug}>
                <Link href={`/chronicle/${item.slug}/`}>
                  {item.date} {item.title}
                </Link>
              </li>
            ))}
          </SearchSection>
          <SearchSection title="Work">
            {data.work.map((item) => (
              <li key={item.slug}>
                <Link href={`/works/creative/${item.slug}/`}>
                  {item.title}
                </Link>
              </li>
            ))}
          </SearchSection>
        </div>
      ) : null}
    </div>
  );
}

function SearchSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <ul className="mt-2 list-none space-y-1.5 p-0 text-sm [&_a]:text-foreground [&_a]:underline-offset-2 hover:[&_a]:underline">
        {children}
      </ul>
    </section>
  );
}
