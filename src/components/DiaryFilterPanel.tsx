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
  WEEKDAY_LABELS,
  emptyDiaryFilter,
  diaryFilterActive,
  serializeDiaryFilter,
  type DiaryFilterState,
} from "@/lib/content/diary-filter";

type Props = {
  tags: string[];
  initial: DiaryFilterState;
  /** Base path for filter apply (default /diary/) */
  basePath?: string;
  /** Hide weekday filter (e.g. Clips). Default true. */
  showWeekdays?: boolean;
  /** Hide tag chips when a left-rail tag list is used (Clips). */
  showTags?: boolean;
};

export function DiaryFilterPanel({
  tags,
  initial,
  basePath = "/diary/",
  showWeekdays = true,
  showTags = true,
}: Props) {
  const [draft, setDraft] = useState<DiaryFilterState>(() =>
    showWeekdays ? initial : { ...initial, weekdays: [] },
  );

  const normalized = useMemo(
    () => (showWeekdays ? draft : { ...draft, weekdays: [] as number[] }),
    [draft, showWeekdays],
  );

  const api = useMemo<SearchFilterApi>(
    () => ({
      getQueryString: () => serializeDiaryFilter(normalized),
      getBasePath: () => basePath,
      isActive: () => diaryFilterActive(normalized),
      clearDraft: () =>
        setDraft(
          showTags
            ? emptyDiaryFilter()
            : { ...emptyDiaryFilter(), tags: draft.tags },
        ),
    }),
    [normalized, basePath, showTags, draft.tags],
  );
  useRegisterSearchFilter(api);

  const weekdayOptions = WEEKDAY_LABELS.map((label, i) => ({
    value: i,
    label,
  }));

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

      {showWeekdays ? (
        <FilterSection label="曜日">
          <FilterOptionChips
            options={weekdayOptions}
            value={draft.weekdays}
            onChange={(weekdays) => setDraft((d) => ({ ...d, weekdays }))}
          />
        </FilterSection>
      ) : null}

      {showTags ? (
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
      ) : null}
    </div>
  );
}
