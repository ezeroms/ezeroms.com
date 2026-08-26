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
  tags: string[];
  initial: GiantsFilterState;
  basePath?: string;
};

export function GiantsFilterPanel({
  tags,
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
        label="タグ"
        contentClassName="max-h-56 overflow-y-auto"
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
