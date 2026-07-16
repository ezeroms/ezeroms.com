"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  emptyGiantsFilter,
  giantsFilterActive,
  serializeGiantsFilter,
  type GiantsFilterState,
} from "@/lib/content/giants-filter";
import { cn } from "@/lib/cn";

type Props = {
  topics: string[];
  initial: GiantsFilterState;
  basePath?: string;
};

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function summary(values: string[]): string {
  if (!values.length) return "指定なし";
  if (values.length <= 2) return values.join("、");
  return `${values.slice(0, 2).join("、")} 他${values.length - 2}`;
}

export function GiantsFilterPanel({
  topics,
  initial,
  basePath = "/shoulders-of-giants/",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<GiantsFilterState>(initial);

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(initial) ||
    giantsFilterActive(draft);
  const canClear = giantsFilterActive(draft) || giantsFilterActive(initial);

  function apply() {
    router.push(`${basePath}${serializeGiantsFilter(draft)}`);
    setOpen(false);
  }

  function clearAll() {
    setDraft(emptyGiantsFilter());
    router.push(basePath);
    setOpen(false);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 pb-3">
        <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          絞り込み
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="overflow-hidden rounded-md border border-border">
          <div>
            <button
              type="button"
              className={cn(
                "grid w-full grid-cols-[auto_1fr_auto] items-center gap-2",
                "border-0 bg-transparent px-3 py-2.5 text-left",
                "cursor-pointer text-foreground hover:bg-accent",
              )}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              <span className="whitespace-nowrap text-sm font-semibold">
                トピック
              </span>
              <span className="truncate text-[13px] text-muted-foreground">
                {summary(draft.topics)}
              </span>
              <span className="text-xs text-muted-foreground" aria-hidden>
                {open ? "▾" : "▸"}
              </span>
            </button>
            {open ? (
              <div className="max-h-72 overflow-y-auto border-t border-border px-3 py-2.5">
                <div className="flex flex-col gap-1.5">
                  {topics.map((topic) => (
                    <label
                      key={topic}
                      className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 shrink-0"
                        checked={draft.topics.includes(topic)}
                        onChange={() =>
                          setDraft((d) => ({
                            ...d,
                            topics: toggleInList(d.topics, topic),
                          }))
                        }
                      />
                      <span>{topic}</span>
                    </label>
                  ))}
                  {!topics.length ? (
                    <p className="m-0 text-[13px] text-muted-foreground">
                      トピックがありません
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-auto shrink-0 space-y-2 border-t border-border pt-3">
        <button
          type="button"
          className={cn(
            "w-full rounded-md border-0 px-4 py-2.5 text-sm font-semibold",
            "bg-primary text-primary-foreground",
            "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
          )}
          onClick={apply}
          disabled={!dirty && !giantsFilterActive(initial)}
        >
          絞り込み
        </button>
        {canClear ? (
          <button
            type="button"
            className={cn(
              "w-full rounded-md border border-border bg-transparent px-4 py-2.5 text-[13px]",
              "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            onClick={clearAll}
          >
            クリア
          </button>
        ) : null}
      </div>
    </div>
  );
}
