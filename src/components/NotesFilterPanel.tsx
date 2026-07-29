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
  WEEKDAY_LABELS,
  emptyNotesFilter,
  notesFilterActive,
  serializeNotesFilter,
  type NotesFilterState,
} from "@/lib/content/notes-filter";

type Props = {
  tags: string[];
  places?: string[];
  initial: NotesFilterState;
  /** Base path for filter apply (default /diary/) */
  basePath?: string;
  /** Hide place filter (e.g. Clips). Default true when places provided. */
  showPlaces?: boolean;
  /** Hide weekday filter (e.g. Clips). Default true. */
  showWeekdays?: boolean;
};

export function NotesFilterPanel({
  tags,
  places = [],
  initial,
  basePath = "/diary/",
  showPlaces = true,
  showWeekdays = true,
}: Props) {
  const [draft, setDraft] = useState<NotesFilterState>(() =>
    showWeekdays ? initial : { ...initial, weekdays: [] },
  );

  const normalized = useMemo(
    () => (showWeekdays ? draft : { ...draft, weekdays: [] as number[] }),
    [draft, showWeekdays],
  );

  const api = useMemo<SearchFilterApi>(
    () => ({
      getQueryString: () => serializeNotesFilter(normalized),
      getBasePath: () => basePath,
      isActive: () => notesFilterActive(normalized),
      clearDraft: () => setDraft(emptyNotesFilter()),
    }),
    [normalized, basePath],
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

      {showPlaces ? (
        <FilterSection
          label="場所"
          contentClassName="max-h-40 overflow-y-auto"
        >
          <FilterOptionChips
            options={places.map((place) => ({ value: place, label: place }))}
            value={draft.places}
            onChange={(next) => setDraft((d) => ({ ...d, places: next }))}
            emptyMessage="場所がありません"
          />
        </FilterSection>
      ) : null}
    </div>
  );
}
