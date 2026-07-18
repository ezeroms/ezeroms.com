"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
};

/**
 * ヘッダー右端の控えめな検索。
 * Enter で /search/?q= に遷移する（結果ページは既存の SearchClient）。
 */
export function HeaderSearch({ className }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/search/");
      return;
    }
    router.push(`/search/?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={cn("flex shrink-0 items-center", className)}
    >
      <label className="relative block">
        <span className="sr-only">サイト内検索</span>
        <Search
          className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="検索"
          autoComplete="off"
          className={cn(
            "h-7 w-24 border-0 bg-transparent pl-7 pr-2 text-sm text-foreground",
            "placeholder:text-muted-foreground/60",
            "outline-none ring-0",
            "border-b border-transparent transition-[width,border-color] duration-200",
            "focus:w-36 focus:border-border sm:w-28 sm:focus:w-40",
          )}
        />
      </label>
    </form>
  );
}
