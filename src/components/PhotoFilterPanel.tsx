"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FilterAccordionRow } from "@/components/filter/FilterAccordionRow";
import {
  FilterPanelFooter,
  FilterPanelHeading,
} from "@/components/filter/FilterPanelChrome";
import {
  summarizeFilterSelection,
  toggleListValue,
} from "@/components/filter/filterPanelUtils";
import {
  emptyPhotoFilter,
  photoFilterActive,
  serializePhotoFilter,
  type PhotoFilterState,
} from "@/lib/content/photo-filter";

type OpenSection = "year" | null;

type Props = {
  years: string[];
  initial: PhotoFilterState;
  basePath: string;
};

export function PhotoFilterPanel({ years, initial, basePath }: Props) {
  const router = useRouter();
  const [openSection, setOpenSection] = useState<OpenSection>(null);
  const [draft, setDraft] = useState<PhotoFilterState>({
    ...initial,
    tags: [],
  });

  const yearsNewestFirst = useMemo(
    () => [...years].sort((a, b) => b.localeCompare(a)),
    [years],
  );

  const isDirty =
    JSON.stringify(draft) !== JSON.stringify(initial) ||
    photoFilterActive(draft);
  const showClear =
    photoFilterActive(draft) || photoFilterActive(initial);

  function toggleSection(section: OpenSection) {
    setOpenSection((current) => (current === section ? null : section));
  }

  function applyFilter() {
    router.push(
      `${basePath}${serializePhotoFilter({ ...draft, tags: [] })}`,
    );
    setOpenSection(null);
  }

  function clearFilter() {
    setDraft(emptyPhotoFilter());
    router.push(basePath);
    setOpenSection(null);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <FilterPanelHeading />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="overflow-hidden rounded-md border border-border">
          <FilterAccordionRow
            label="年"
            summary={summarizeFilterSelection(
              draft.years.map((year) => `${year}年`),
            )}
            open={openSection === "year"}
            onToggle={() => toggleSection("year")}
          >
            <div className="flex flex-col gap-1.5">
              {yearsNewestFirst.map((year) => (
                <label
                  key={year}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.years.includes(year)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        years: toggleListValue(current.years, year),
                      }))
                    }
                  />
                  <span>{year}年</span>
                </label>
              ))}
              {!yearsNewestFirst.length ? (
                <p className="m-0 text-sm text-muted-foreground">
                  年データがありません
                </p>
              ) : null}
            </div>
          </FilterAccordionRow>
        </div>
      </div>

      <FilterPanelFooter
        onApply={applyFilter}
        onClear={clearFilter}
        applyDisabled={!isDirty && !photoFilterActive(initial)}
        showClear={showClear}
      />
    </div>
  );
}
