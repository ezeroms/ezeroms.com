"use client";

import { DateRangeField } from "@/components/filter/DateRangeField";
import { FilterOptionChips } from "@/components/filter/FilterOptionChips";
import { FilterSection } from "@/components/filter/FilterSection";
import {
  useRegisterSearchFilter,
  type SearchFilterApi,
} from "@/components/filter/SearchFilterContext";
import { sortWorkCategories } from "@/components/WorkHeaderNav";
import { useMemo, useState } from "react";
import {
  emptyWorkFilter,
  serializeWorkFilter,
  workCategoryLabel,
  workFilterActive,
  WORK_KIND_LABELS,
  type WorkFilterState,
} from "@/lib/content/work-filter";
import type { WorkKind } from "@/types/content";

type Props = {
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
  categories,
  tags,
  clients,
  initial,
  basePath = "/works/creative/",
  showKinds = false,
  showCategories = true,
  showTags = true,
}: Props) {
  const [draft, setDraft] = useState<WorkFilterState>({
    ...emptyWorkFilter(),
    ...initial,
    kinds: initial.kinds ?? [],
  });

  const categoriesSorted = useMemo(
    () => sortWorkCategories(categories),
    [categories],
  );

  const clientsSorted = useMemo(
    () => [...clients].sort((a, b) => a.localeCompare(b, "ja")),
    [clients],
  );

  const api = useMemo<SearchFilterApi>(
    () => ({
      getQueryString: () => serializeWorkFilter(draft),
      getBasePath: () => basePath,
      isActive: () => workFilterActive(draft),
      clearDraft: () => setDraft(emptyWorkFilter()),
    }),
    [draft, basePath],
  );
  useRegisterSearchFilter(api);

  return (
    <div className="space-y-5">
      {showKinds ? (
        <FilterSection label="種類">
          <FilterOptionChips
            options={ALL_KINDS.map((kind) => ({
              value: kind,
              label: WORK_KIND_LABELS[kind],
            }))}
            value={draft.kinds}
            onChange={(kinds) => setDraft((d) => ({ ...d, kinds }))}
          />
        </FilterSection>
      ) : null}

      <FilterSection label="時期">
        <DateRangeField
          value={{ from: draft.from, to: draft.to }}
          onChange={(range) =>
            setDraft((d) => ({ ...d, from: range.from, to: range.to }))
          }
        />
      </FilterSection>

      {showCategories ? (
        <FilterSection
          label="カテゴリ"
          contentClassName="max-h-40 overflow-y-auto"
        >
          <FilterOptionChips
            options={categoriesSorted.map((cat) => ({
              value: cat,
              label: workCategoryLabel(cat),
            }))}
            value={draft.categories}
            onChange={(next) => setDraft((d) => ({ ...d, categories: next }))}
            emptyMessage="カテゴリがありません"
          />
        </FilterSection>
      ) : null}

      {showTags ? (
        <FilterSection
          label="タグ"
          contentClassName="max-h-40 overflow-y-auto"
        >
          <FilterOptionChips
            options={tags.map((tag) => ({ value: tag, label: tag }))}
            value={draft.tags}
            onChange={(next) => setDraft((d) => ({ ...d, tags: next }))}
            emptyMessage="タグがありません"
          />
        </FilterSection>
      ) : null}

      <FilterSection
        label="クライアント"
        contentClassName="max-h-40 overflow-y-auto"
      >
        <FilterOptionChips
          options={clientsSorted.map((client) => ({
            value: client,
            label: client,
          }))}
          value={draft.clients}
          onChange={(next) => setDraft((d) => ({ ...d, clients: next }))}
          emptyMessage="クライアントがありません"
        />
      </FilterSection>
    </div>
  );
}
