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
  CHRONICLE_INTERESTS,
  emptyChronicleFilter,
  chronicleFilterActive,
  serializeChronicleFilter,
  type ChronicleFilterState,
  type ChronicleInterestId,
} from "@/lib/content/chronicle-filter";

type Props = {
  tags: string[];
  initial: ChronicleFilterState;
  basePath?: string;
};

export function ChronicleFilterPanel({
  tags,
  initial,
  basePath = "/chronicle/",
}: Props) {
  const [draft, setDraft] = useState<ChronicleFilterState>(initial);

  const api = useMemo<SearchFilterApi>(
    () => ({
      getQueryString: () => serializeChronicleFilter(draft),
      getBasePath: () => basePath,
      isActive: () => chronicleFilterActive(draft),
      clearDraft: () => setDraft(emptyChronicleFilter()),
    }),
    [draft, basePath],
  );
  useRegisterSearchFilter(api);

  return (
    <div className="space-y-5">
      <FilterSection label="関心">
        <FilterOptionChips
          options={CHRONICLE_INTERESTS.map((interest) => ({
            value: interest.id as ChronicleInterestId,
            label: interest.label,
            description: interest.description,
          }))}
          value={draft.interests}
          onChange={(interests) => setDraft((d) => ({ ...d, interests }))}
        />
      </FilterSection>

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
          options={tags.map((tag) => ({ value: tag, label: tag }))}
          value={draft.tags}
          onChange={(next) => setDraft((d) => ({ ...d, tags: next }))}
          emptyMessage="タグがありません"
        />
      </FilterSection>
    </div>
  );
}
