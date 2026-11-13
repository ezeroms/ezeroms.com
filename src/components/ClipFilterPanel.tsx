"use client";

import { DateRangeField } from "@/components/filter/DateRangeField";
import { FilterSection } from "@/components/filter/FilterSection";
import {
  useRegisterSearchFilter,
  type SearchFilterApi,
} from "@/components/filter/SearchFilterContext";
import { useMemo, useState } from "react";
import {
  clipFilterActive,
  emptyClipFilter,
  serializeClipFilter,
  type ClipFilterState,
} from "@/lib/content/clip-filter";

type Props = {
  initial: ClipFilterState;
  basePath?: string;
};

/**
 * Clips の絞り込みは時期だけ。
 * タグは左レール／ボトムシート側で選ぶので、クリアしてもタグは残す。
 */
export function ClipFilterPanel({
  initial,
  basePath = "/clips/",
}: Props) {
  const [draft, setDraft] = useState<ClipFilterState>(initial);

  const api = useMemo<SearchFilterApi>(
    () => ({
      getQueryString: () => serializeClipFilter(draft),
      getBasePath: () => basePath,
      isActive: () => clipFilterActive(draft),
      clearDraft: () =>
        setDraft({ ...emptyClipFilter(), tags: draft.tags }),
    }),
    [draft, basePath],
  );
  useRegisterSearchFilter(api);

  return (
    <div className="space-y-5">
      <FilterSection label="時期">
        <DateRangeField
          value={{ from: draft.from, to: draft.to }}
          onChange={(range) =>
            setDraft((current) => ({
              ...current,
              from: range.from,
              to: range.to,
            }))
          }
        />
      </FilterSection>
    </div>
  );
}
