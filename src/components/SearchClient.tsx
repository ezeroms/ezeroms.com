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

export function SearchClient() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setData(null);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ac.signal,
          cache: "no-store",
        });
        setData((await res.json()) as SearchResult);
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      abortRef.current?.abort();
    };
  }, [q]);

  return (
    <div>
      <h1>Search</h1>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search…"
        style={{ width: "100%", maxWidth: 480, padding: "0.5rem" }}
      />
      {loading ? <p>Searching…</p> : null}
      {data ? (
        <div>
          <section>
            <h2>Notes</h2>
            <ul>
              {data.diary.map((d) => (
                <li key={d.slug}>
                  <Link href={`/diary/${d.slug}/`}>{d.date}</Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Column</h2>
            <ul>
              {data.column.map((d) => (
                <li key={d.slug}>
                  <Link href={`/column/${d.slug}/`}>{d.title}</Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Chronicle</h2>
            <ul>
              {data.chronicle.map((d) => (
                <li key={d.slug}>
                  <Link href={`/chronicle/${d.slug}/`}>
                    {d.date} {d.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Work</h2>
            <ul>
              {data.work.map((d) => (
                <li key={d.slug}>
                  <Link href={`/work/${d.slug}/`}>{d.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
