"use client";

import { FilterAccordionRow } from "@/components/filter/FilterAccordionRow";
import {
  FilterPanelFooter,
  FilterPanelHeading,
} from "@/components/filter/FilterPanelChrome";
import {
  summarizeFilterSelection,
  toggleListValue,
} from "@/components/filter/filterPanelUtils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CHRONICLE_INTERESTS,
  emptyChronicleFilter,
  chronicleFilterActive,
  interestLabel,
  serializeChronicleFilter,
  type ChronicleFilterState,
  type ChronicleInterestId,
} from "@/lib/content/chronicle-filter";

type Section = "interest" | "year" | "tag" | null;

type Props = {
  years: string[];
  tags: string[];
  initial: ChronicleFilterState;
  basePath?: string;
};

export function ChronicleFilterPanel({
  years,
  tags,
  initial,
  basePath = "/chronicle/",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<Section>(null);
  const [draft, setDraft] = useState<ChronicleFilterState>(initial);

  const yearsNewestFirst = useMemo(
    () => [...years].sort((a, b) => b.localeCompare(a)),
    [years],
  );

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(initial) ||
    chronicleFilterActive(draft);
  const canClear =
    chronicleFilterActive(draft) || chronicleFilterActive(initial);

  function toggleSection(key: Section) {
    setOpen((prev) => (prev === key ? null : key));
  }

  function apply() {
    router.push(`${basePath}${serializeChronicleFilter(draft)}`);
    setOpen(null);
  }

  function clearAll() {
    setDraft(emptyChronicleFilter());
    router.push(basePath);
    setOpen(null);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <FilterPanelHeading />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="overflow-hidden rounded-md border border-border">
          <FilterAccordionRow
            label="関心"
            summary={summarizeFilterSelection(draft.interests.map(interestLabel))}
            open={open === "interest"}
            onToggle={() => toggleSection("interest")}
          >
            <div className="flex flex-col gap-2">
              {CHRONICLE_INTERESTS.map((interest) => (
                <label
                  key={interest.id}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.interests.includes(interest.id)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        interests: toggleListValue(
                          d.interests,
                          interest.id as ChronicleInterestId,
                        ),
                      }))
                    }
                  />
                  <span>
                    <span className="font-medium">{interest.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {interest.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </FilterAccordionRow>

          <FilterAccordionRow
            label="年"
            summary={summarizeFilterSelection(draft.years.map((y) => `${y}年`))}
            open={open === "year"}
            onToggle={() => toggleSection("year")}
            showTopBorder
          >
            <div className="flex flex-col gap-1.5">
              {yearsNewestFirst.map((y) => (
                <label
                  key={y}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.years.includes(y)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        years: toggleListValue(d.years, y),
                      }))
                    }
                  />
                  <span>{y}年</span>
                </label>
              ))}
              {!yearsNewestFirst.length ? (
                <p className="m-0 text-sm text-muted-foreground">
                  年データがありません
                </p>
              ) : null}
            </div>
          </FilterAccordionRow>

          <FilterAccordionRow
            label="タグ"
            summary={summarizeFilterSelection(draft.tags)}
            open={open === "tag"}
            onToggle={() => toggleSection("tag")}
            showTopBorder
          >
            <div className="flex flex-col gap-1.5">
              {tags.map((tag) => (
                <label
                  key={tag}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.tags.includes(tag)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        tags: toggleListValue(d.tags, tag),
                      }))
                    }
                  />
                  <span>{tag}</span>
                </label>
              ))}
              {!tags.length ? (
                <p className="m-0 text-sm text-muted-foreground">
                  タグがありません
                </p>
              ) : null}
            </div>
          </FilterAccordionRow>
        </div>
      </div>

      <FilterPanelFooter
        onApply={apply}
        onClear={clearAll}
        applyDisabled={!dirty && !chronicleFilterActive(initial)}
        showClear={canClear}
      />
    </div>
  );
}

