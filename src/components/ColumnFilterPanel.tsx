"use client";

import { DateRangeField } from "@/components/filter/DateRangeField";
import { FilterOptionChips } from "@/components/filter/FilterOptionChips";
import { FilterSection } from "@/components/filter/FilterSection";
import {
  useRegisterSearchFilter,
  type SearchFilterApi,
} from "@/components/filter/SearchFilterContext";
import { useMemo, useState } from "react";
import {
  categoryLabel,
  columnFilterActive,
  emptyColumnFilter,
  serializeColumnFilter,
  type ColumnFilterState,
} from "@/lib/content/column-filter";

type Props = {
  categories: string[];
  tags: string[];
  initial: ColumnFilterState;
  basePath?: string;
};

export function ColumnFilterPanel({
  categories,
  tags,
  initial,
  basePath = "/column/",
}: Props) {
  const [draft, setDraft] = useState<ColumnFilterState>(() => ({
    ...initial,
    weekdays: [],
  }));

  const normalized = useMemo(
    () => ({ ...draft, weekdays: [] as number[] }),
    [draft],
  );

  const categoriesSorted = useMemo(
    () =>
      [...categories].sort((a, b) =>
        categoryLabel(a).localeCompare(categoryLabel(b), "ja"),
      ),
    [categories],
  );

  const api = useMemo<SearchFilterApi>(
    () => ({
      getQueryString: () => serializeColumnFilter(normalized),
      getBasePath: () => basePath,
      isActive: () => columnFilterActive(normalized),
      clearDraft: () => setDraft(emptyColumnFilter()),
    }),
    [normalized, basePath],
  );
  useRegisterSearchFilter(api);

  return (
    <div className="space-y-5">
      <FilterSection label="時期">
        <DateRangeField
          value={{ from: draft.from, to: draft.to }}
          onChange={(range) =>
            setDraft((d) => ({ ...d, from: range.from, to: range.to }))
          }
        />
      </FilterSection>

      <FilterSection
        label="カテゴリ"
        contentClassName="max-h-40 overflow-y-auto"
      >
        <FilterOptionChips
          options={categoriesSorted.map((cat) => ({
            value: cat,
            label: categoryLabel(cat),
          }))}
          value={draft.categories}
          onChange={(next) => setDraft((d) => ({ ...d, categories: next }))}
          emptyMessage="カテゴリがありません"
        />
      </FilterSection>

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
    </div>
  );
}
