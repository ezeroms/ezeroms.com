import type { BreadcrumbItem } from "@/lib/site/breadcrumbs";
import {
  interestLabel,
  type ChronicleFilterState,
} from "@/lib/content/chronicle-filter";
import {
  categoryLabel,
  type ColumnFilterState,
} from "@/lib/content/column-filter";
import type { GiantsFilterState } from "@/lib/content/giants-filter";
import {
  formatDateRangeSummary,
  WEEKDAY_LABELS,
  type NotesFilterState,
} from "@/lib/content/notes-filter";
import {
  WORK_KIND_LABELS,
  workCategoryLabel,
  type WorkFilterState,
} from "@/lib/content/work-filter";

/** パンくず末尾用に、複数条件を「 · 」でつなぐ。 */
export function joinBreadcrumbParts(parts: string[]): string | null {
  const cleaned = parts.map((p) => p.trim()).filter(Boolean);
  if (!cleaned.length) return null;
  return cleaned.join(" · ");
}

export function summarizeNotesFilter(
  filter: NotesFilterState,
): string | null {
  return joinBreadcrumbParts([
    formatDateRangeSummary(filter) ?? "",
    ...filter.weekdays.map((d) => WEEKDAY_LABELS[d]),
    ...filter.tags,
    ...filter.places,
  ]);
}

export function summarizeColumnFilter(
  filter: ColumnFilterState,
): string | null {
  return joinBreadcrumbParts([
    formatDateRangeSummary(filter) ?? "",
    ...filter.categories.map(categoryLabel),
    ...filter.tags,
  ]);
}

export function summarizeWorkFilter(filter: WorkFilterState): string | null {
  return joinBreadcrumbParts([
    formatDateRangeSummary(filter) ?? "",
    ...filter.kinds.map((k) => WORK_KIND_LABELS[k]),
    ...filter.categories.map(workCategoryLabel),
    ...filter.tags,
    ...filter.clients,
  ]);
}

export function summarizeChronicleFilter(
  filter: ChronicleFilterState,
): string | null {
  return joinBreadcrumbParts([
    ...filter.interests.map(interestLabel),
    formatDateRangeSummary(filter) ?? "",
    ...filter.tags,
  ]);
}

export function summarizeGiantsFilter(
  filter: GiantsFilterState,
): string | null {
  return joinBreadcrumbParts(filter.topics);
}

/**
 * 一覧パンくずに絞り込み条件を足す。
 * 末尾のセクション名に href を付け、条件を新しい現在地にする。
 */
export function withFilterBreadcrumb(
  crumbs: BreadcrumbItem[] | null,
  filterLabel: string | null | undefined,
  sectionHref: string,
): BreadcrumbItem[] | null {
  if (!crumbs?.length) return crumbs;
  const label = filterLabel?.trim();
  if (!label) return crumbs;

  const next = crumbs.map((crumb, index) => {
    const isLast = index === crumbs.length - 1;
    if (!isLast || crumb.href) return crumb;
    return { ...crumb, href: sectionHref };
  });

  return [...next, { label }];
}
