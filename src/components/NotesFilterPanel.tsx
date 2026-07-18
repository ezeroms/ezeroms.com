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
  WEEKDAY_LABELS,
  emptyNotesFilter,
  formatMonthLabel,
  notesFilterActive,
  serializeNotesFilter,
  type NotesFilterState,
} from "@/lib/content/notes-filter";

type Section = "period" | "weekday" | "tag" | "place" | null;

type Props = {
  months: string[];
  tags: string[];
  places?: string[];
  initial: NotesFilterState;
  /** Base path for filter apply (default /diary/) */
  basePath?: string;
  /** Hide place filter (e.g. Clips). Default true when places provided. */
  showPlaces?: boolean;
};

export function NotesFilterPanel({
  months,
  tags,
  places = [],
  initial,
  basePath = "/diary/",
  showPlaces = true,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<Section>(null);
  const [draft, setDraft] = useState<NotesFilterState>(initial);

  const monthsNewestFirst = useMemo(
    () => [...months].sort((a, b) => b.localeCompare(a)),
    [months],
  );

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(initial) ||
    notesFilterActive(draft);

  const canClear = notesFilterActive(draft) || notesFilterActive(initial);

  function toggleSection(key: Section) {
    setOpen((prev) => (prev === key ? null : key));
  }

  function apply() {
    const qs = serializeNotesFilter(draft);
    router.push(`${basePath}${qs}`);
    setOpen(null);
  }

  function clearAll() {
    const empty = emptyNotesFilter();
    setDraft(empty);
    router.push(basePath);
    setOpen(null);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <FilterPanelHeading />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="overflow-hidden rounded-md border border-border">
          <FilterAccordionRow
            label="時期"
            summary={summarizeFilterSelection(draft.months.map(formatMonthLabel))}
            open={open === "period"}
            onToggle={() => toggleSection("period")}
          >
            <div className="flex flex-col gap-1.5">
              {monthsNewestFirst.map((ym) => (
                <label
                  key={ym}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.months.includes(ym)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        months: toggleListValue(d.months, ym),
                      }))
                    }
                  />
                  <span>{formatMonthLabel(ym)}</span>
                </label>
              ))}
              {!monthsNewestFirst.length ? (
                <p className="m-0 text-sm text-muted-foreground">
                  月データがありません
                </p>
              ) : null}
            </div>
          </FilterAccordionRow>

          <FilterAccordionRow
            label="曜日"
            summary={summarizeFilterSelection(
              draft.weekdays.map((w) => WEEKDAY_LABELS[w]),
            )}
            open={open === "weekday"}
            onToggle={() => toggleSection("weekday")}
            showTopBorder
          >
            <div className="grid grid-cols-4 gap-1.5">
              {WEEKDAY_LABELS.map((label, i) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={draft.weekdays.includes(i)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        weekdays: toggleListValue(d.weekdays, i),
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
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

          {showPlaces ? (
            <FilterAccordionRow
              label="場所"
              summary={summarizeFilterSelection(draft.places)}
              open={open === "place"}
              onToggle={() => toggleSection("place")}
              showTopBorder
            >
              <div className="flex flex-col gap-1.5">
                {places.map((place) => (
                  <label
                    key={place}
                    className="flex cursor-pointer items-start gap-2 text-sm leading-snug text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={draft.places.includes(place)}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          places: toggleListValue(d.places, place),
                        }))
                      }
                    />
                    <span>{place}</span>
                  </label>
                ))}
                {!places.length ? (
                  <p className="m-0 text-sm text-muted-foreground">
                    場所がありません
                  </p>
                ) : null}
              </div>
            </FilterAccordionRow>
          ) : null}
        </div>
      </div>

      <FilterPanelFooter
        onApply={apply}
        onClear={clearAll}
        applyDisabled={!dirty && !notesFilterActive(initial)}
        showClear={canClear}
      />
    </div>
  );
}

