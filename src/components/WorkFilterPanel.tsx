"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  emptyWorkFilter,
  serializeWorkFilter,
  workCategoryLabel,
  workFilterActive,
  WORK_KIND_LABELS,
  type WorkFilterState,
} from "@/lib/content/work-filter";
import { sortWorkCategories } from "@/components/WorkHeaderNav";
import type { WorkKind } from "@/types/content";
import { cn } from "@/lib/cn";

type Section = "kind" | "year" | "category" | "tag" | "client" | null;

type Props = {
  years: string[];
  categories: string[];
  tags: string[];
  clients: string[];
  initial: WorkFilterState;
  basePath?: string;
  showKinds?: boolean;
  showCategories?: boolean;
  showTags?: boolean;
};

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function summary(values: string[]): string {
  if (!values.length) return "指定なし";
  if (values.length <= 2) return values.join("、");
  return `${values.slice(0, 2).join("、")} 他${values.length - 2}`;
}

const ALL_KINDS = Object.keys(WORK_KIND_LABELS) as WorkKind[];

export function WorkFilterPanel({
  years,
  categories,
  tags,
  clients,
  initial,
  basePath = "/works/creative/",
  showKinds = false,
  showCategories = true,
  showTags = true,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<Section>(null);
  const [draft, setDraft] = useState<WorkFilterState>({
    ...emptyWorkFilter(),
    ...initial,
    kinds: initial.kinds ?? [],
  });

  const yearsNewestFirst = useMemo(
    () => [...years].sort((a, b) => b.localeCompare(a)),
    [years],
  );

  const categoriesSorted = useMemo(
    () => sortWorkCategories(categories),
    [categories],
  );

  const clientsSorted = useMemo(
    () => [...clients].sort((a, b) => a.localeCompare(b, "ja")),
    [clients],
  );

  const dirty =
    JSON.stringify(draft) !== JSON.stringify({ ...emptyWorkFilter(), ...initial, kinds: initial.kinds ?? [] }) ||
    workFilterActive(draft);
  const canClear = workFilterActive(draft) || workFilterActive(initial);

  function toggleSection(key: Section) {
    setOpen((prev) => (prev === key ? null : key));
  }

  function apply() {
    router.push(`${basePath}${serializeWorkFilter(draft)}`);
    setOpen(null);
  }

  function clearAll() {
    setDraft(emptyWorkFilter());
    router.push(basePath);
    setOpen(null);
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
          {showKinds ? (
            <FilterRow
              label="種類"
              summary={summary(draft.kinds.map((k) => WORK_KIND_LABELS[k]))}
              open={open === "kind"}
              onToggle={() => toggleSection("kind")}
            >
              <div className="flex flex-col gap-1.5">
                {ALL_KINDS.map((kind) => (
                  <label
                    key={kind}
                    className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={draft.kinds.includes(kind)}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          kinds: toggleInList(d.kinds, kind),
                        }))
                      }
                    />
                    <span>{WORK_KIND_LABELS[kind]}</span>
                  </label>
                ))}
              </div>
            </FilterRow>
          ) : null}

          <FilterRow
            label="年"
            summary={summary(draft.years.map((y) => `${y}年`))}
            open={open === "year"}
            onToggle={() => toggleSection("year")}
            bordered={showKinds}
          >
            <div className="flex flex-col gap-1.5">
              {yearsNewestFirst.map((y) => (
                <label
                  key={y}
                  className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.years.includes(y)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        years: toggleInList(d.years, y),
                      }))
                    }
                  />
                  <span>{y}年</span>
                </label>
              ))}
              {!yearsNewestFirst.length ? (
                <p className="m-0 text-[13px] text-muted-foreground">
                  年データがありません
                </p>
              ) : null}
            </div>
          </FilterRow>

          {showCategories ? (
            <FilterRow
              label="カテゴリ"
              summary={summary(draft.categories.map(workCategoryLabel))}
              open={open === "category"}
              onToggle={() => toggleSection("category")}
              bordered
            >
              <div className="flex flex-col gap-1.5">
                {categoriesSorted.map((cat) => (
                  <label
                    key={cat}
                    className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={draft.categories.includes(cat)}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          categories: toggleInList(d.categories, cat),
                        }))
                      }
                    />
                    <span>{workCategoryLabel(cat)}</span>
                  </label>
                ))}
                {!categoriesSorted.length ? (
                  <p className="m-0 text-[13px] text-muted-foreground">
                    カテゴリがありません
                  </p>
                ) : null}
              </div>
            </FilterRow>
          ) : null}

          {showTags ? (
            <FilterRow
              label="タグ"
              summary={summary(draft.tags)}
              open={open === "tag"}
              onToggle={() => toggleSection("tag")}
              bordered
            >
              <div className="flex flex-col gap-1.5">
                {tags.map((tag) => (
                  <label
                    key={tag}
                    className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={draft.tags.includes(tag)}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          tags: toggleInList(d.tags, tag),
                        }))
                      }
                    />
                    <span>{tag}</span>
                  </label>
                ))}
                {!tags.length ? (
                  <p className="m-0 text-[13px] text-muted-foreground">
                    タグがありません
                  </p>
                ) : null}
              </div>
            </FilterRow>
          ) : null}

          <FilterRow
            label="クライアント"
            summary={summary(draft.clients)}
            open={open === "client"}
            onToggle={() => toggleSection("client")}
            bordered
          >
            <div className="flex flex-col gap-1.5">
              {clientsSorted.map((client) => (
                <label
                  key={client}
                  className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.clients.includes(client)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        clients: toggleInList(d.clients, client),
                      }))
                    }
                  />
                  <span>{client}</span>
                </label>
              ))}
              {!clientsSorted.length ? (
                <p className="m-0 text-[13px] text-muted-foreground">
                  クライアントがありません
                </p>
              ) : null}
            </div>
          </FilterRow>
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
          disabled={!dirty && !workFilterActive(initial)}
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

function FilterRow({
  label,
  summary: summaryText,
  open,
  onToggle,
  bordered,
  children,
}: {
  label: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(bordered && "border-t border-border")}>
      <button
        type="button"
        className={cn(
          "grid w-full grid-cols-[auto_1fr_auto] items-center gap-2",
          "border-0 bg-transparent px-3 py-2.5 text-left",
          "cursor-pointer text-foreground hover:bg-accent",
        )}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="whitespace-nowrap text-sm font-semibold">{label}</span>
        <span className="truncate text-[13px] text-muted-foreground">
          {summaryText}
        </span>
        <span className="text-xs text-muted-foreground" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        <div className="max-h-52 overflow-y-auto border-t border-border px-3 py-2.5">
          {children}
        </div>
      ) : null}
    </div>
  );
}
