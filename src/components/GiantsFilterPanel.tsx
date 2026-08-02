"use client";

import { FilterOptionChips } from "@/components/filter/FilterOptionChips";
import { FilterSection } from "@/components/filter/FilterSection";
import {
  useRegisterSearchFilter,
  type SearchFilterApi,
} from "@/components/filter/SearchFilterContext";
import { useMemo, useState } from "react";
import {
  emptyGiantsFilter,
  giantsFilterActive,
  serializeGiantsFilter,
  type GiantsFilterState,
} from "@/lib/content/giants-filter";

type Props = {
  topics: string[];
  initial: GiantsFilterState;
  basePath?: string;
};

export function GiantsFilterPanel({
  topics,
  initial,
  basePath = "/shoulders-of-giants/",
}: Props) {
  const [draft, setDraft] = useState<GiantsFilterState>(initial);

  const api = useMemo<SearchFilterApi>(
    () => ({
      getQueryString: () => serializeGiantsFilter(draft),
      getBasePath: () => basePath,
      isActive: () => giantsFilterActive(draft),
      clearDraft: () => setDraft(emptyGiantsFilter()),
    }),
    [draft, basePath],
  );
  useRegisterSearchFilter(api);

  return (
    <div className="space-y-5">
      <FilterSection
        label="トピック"
        contentClassName="max-h-56 overflow-y-auto"
      >
        <FilterOptionChips
          options={topics.map((topic) => ({ value: topic, label: topic }))}
          value={draft.topics}
          onChange={(next) => setDraft((d) => ({ ...d, topics: next }))}
          emptyMessage="トピックがありません"
        />
      </FilterSection>
    </div>
  );
}
