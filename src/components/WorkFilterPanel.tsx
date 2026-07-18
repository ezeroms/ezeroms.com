"use client";

import { FilterAccordionRow } from "@/components/filter/FilterAccordionRow";
import {
  FilterPanelFooter,
  FilterPanelHeading,
} from "@/components/filter/FilterPanelChrome";
import {
  summarizeFilterSelection,
  toggleListValue,
} from "@/components/filter/filterPanelUtils";
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
      <FilterPanelHeading />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="overflow-hidden rounded-md border border-border">
          {showKinds ? (
            <FilterAccordionRow
              label="種類"
              summary={summarizeFilterSelection(draft.kinds.map((k) => WORK_KIND_LABELS[k]))}
              open={open === "kind"}
              onToggle={() => toggleSection("kind")}
            >
              <div className="flex flex-col gap-1.5">
                {ALL_KINDS.map((kind) => (
                  <label
                    key={kind}
                    className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={draft.kinds.includes(kind)}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          kinds: toggleListValue(d.kinds, kind),
                        }))
                      }
                    />
                    <span>{WORK_KIND_LABELS[kind]}</span>
                  </label>
                ))}
              </div>
            </FilterAccordionRow>
          ) : null}

          <FilterAccordionRow
            label="年"
            summary={summarizeFilterSelection(draft.years.map((y) => `${y}年`))}
            open={open === "year"}
            onToggle={() => toggleSection("year")}
            showTopBorder={showKinds}
          >
            <div className="flex flex-col gap-1.5">
              {yearsNewestFirst.map((y) => (
                <label
                  key={y}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.years.includes(y)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        years: toggleListValue(d.years, y),
                      }))
                    }
                  />
                  <span>{y}年</span>
                </label>
              ))}
              {!yearsNewestFirst.length ? (
                <p className="m-0 text-sm text-muted-foreground">
                  年データがありません
                </p>
              ) : null}
            </div>
          </FilterAccordionRow>

          {showCategories ? (
            <FilterAccordionRow
              label="カテゴリ"
              summary={summarizeFilterSelection(draft.categories.map(workCategoryLabel))}
              open={open === "category"}
              onToggle={() => toggleSection("category")}
              showTopBorder
            >
              <div className="flex flex-col gap-1.5">
                {categoriesSorted.map((cat) => (
                  <label
                    key={cat}
                    className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={draft.categories.includes(cat)}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          categories: toggleListValue(d.categories, cat),
                        }))
                      }
                    />
                    <span>{workCategoryLabel(cat)}</span>
                  </label>
                ))}
                {!categoriesSorted.length ? (
                  <p className="m-0 text-sm text-muted-foreground">
                    カテゴリがありません
                  </p>
                ) : null}
              </div>
            </FilterAccordionRow>
          ) : null}

          {showTags ? (
            <FilterAccordionRow
              label="タグ"
              summary={summarizeFilterSelection(draft.tags)}
              open={open === "tag"}
              onToggle={() => toggleSection("tag")}
              showTopBorder
            >
              <div className="flex flex-col gap-1.5">
                {tags.map((tag) => (
                  <label
                    key={tag}
                    className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={draft.tags.includes(tag)}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          tags: toggleListValue(d.tags, tag),
                        }))
                      }
                    />
                    <span>{tag}</span>
                  </label>
                ))}
                {!tags.length ? (
                  <p className="m-0 text-sm text-muted-foreground">
                    タグがありません
                  </p>
                ) : null}
              </div>
            </FilterAccordionRow>
          ) : null}

          <FilterAccordionRow
            label="クライアント"
            summary={summarizeFilterSelection(draft.clients)}
            open={open === "client"}
            onToggle={() => toggleSection("client")}
            showTopBorder
          >
            <div className="flex flex-col gap-1.5">
              {clientsSorted.map((client) => (
                <label
                  key={client}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.clients.includes(client)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        clients: toggleListValue(d.clients, client),
                      }))
                    }
                  />
                  <span>{client}</span>
                </label>
              ))}
              {!clientsSorted.length ? (
                <p className="m-0 text-sm text-muted-foreground">
                  クライアントがありません
                </p>
              ) : null}
            </div>
          </FilterAccordionRow>
        </div>
      </div>

      <FilterPanelFooter
        onApply={apply}
        onClear={clearAll}
        applyDisabled={!dirty && !workFilterActive(initial)}
        showClear={canClear}
      />
    </div>
  );
}

