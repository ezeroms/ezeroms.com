"use client";

import { DateRangeField } from "@/components/filter/DateRangeField";
import {
  FilterOptionChips,
  sameLabelOptions,
} from "@/components/filter/FilterOptionChips";
import { FilterSection } from "@/components/filter/FilterSection";
import {
  useRegisterSearchFilter,
  type SearchFilterApi,
} from "@/components/filter/SearchFilterContext";
import { useMemo, useState } from "react";
import {
  columnFilterActive,
  emptyColumnFilter,
  serializeColumnFilter,
  type ColumnFilterState,
} from "@/lib/content/column-filter";

type Props = {
  tags: string[];
  initial: ColumnFilterState;
  basePath?: string;
};

export function ColumnFilterPanel({
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
        label="タグ"
        contentClassName="max-h-40 overflow-y-auto"
      >
        <FilterOptionChips
          options={sameLabelOptions(tags)}
          value={draft.tags}
          onChange={(next) => setDraft((d) => ({ ...d, tags: next }))}
          emptyMessage="タグがありません"
        />
      </FilterSection>
    </div>
  );
}
