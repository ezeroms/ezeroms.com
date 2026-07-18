"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const router = useRouter();
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [draft, setDraft] = useState<GiantsFilterState>(initial);

  const isDirty =
    JSON.stringify(draft) !== JSON.stringify(initial) ||
    giantsFilterActive(draft);
  const showClear =
    giantsFilterActive(draft) || giantsFilterActive(initial);

  function applyFilter() {
    router.push(`${basePath}${serializeGiantsFilter(draft)}`);
    setIsTopicOpen(false);
  }

  function clearFilter() {
    setDraft(emptyGiantsFilter());
    router.push(basePath);
    setIsTopicOpen(false);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <FilterPanelHeading />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="overflow-hidden rounded-md border border-border">
          <FilterAccordionRow
            label="トピック"
            summary={summarizeFilterSelection(draft.topics)}
            open={isTopicOpen}
            onToggle={() => setIsTopicOpen((open) => !open)}
            contentMaxHeightClassName="max-h-72"
          >
            <div className="flex flex-col gap-1.5">
              {topics.map((topic) => (
                <label
                  key={topic}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.topics.includes(topic)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        topics: toggleListValue(current.topics, topic),
                      }))
                    }
                  />
                  <span>{topic}</span>
                </label>
              ))}
              {!topics.length ? (
                <p className="m-0 text-sm text-muted-foreground">
                  トピックがありません
                </p>
              ) : null}
            </div>
          </FilterAccordionRow>
        </div>
      </div>

      <FilterPanelFooter
        onApply={applyFilter}
        onClear={clearFilter}
        applyDisabled={!isDirty && !giantsFilterActive(initial)}
        showClear={showClear}
      />
    </div>
  );
}
