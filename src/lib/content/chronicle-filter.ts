import {
  appendDateRangeToQuery,
  dateRangeActive,
  emptyDateRange,
  formatDateRangeSummary,
  isoDateInRange,
  parseDateRangeFromSearchParams,
} from "@/lib/content/date-range";
import {
  decodePipeSeparatedList,
  encodePipeSeparatedList,
  firstSearchParamValue,
  toQueryString,
  type SearchParamsRecord,
} from "@/lib/content/filter-search-params";
import type { ChronicleDatePrecision } from "@/types/content";

export type { ChronicleDatePrecision };
/** Interest lenses for Chronicle exploration. */
export type ChronicleInterestId = "society" | "tech" | "personal";

export type ChronicleInterestMeta = {
  id: ChronicleInterestId;
  label: string;
  description: string;
};

export const CHRONICLE_INTERESTS: ChronicleInterestMeta[] = [
  {
    id: "society",
    label: "社会",
    description: "社会・政治・経済・スポーツなどの出来事",
  },
  {
    id: "tech",
    label: "技術",
    description: "技術・プロダクト・インフラの出来事",
  },
  {
    id: "personal",
    label: "自分の関心",
    description: "タグで辿るテーマ史・関心の軸",
  },
];

const SOCIETY_CATEGORIES = new Set(["社会", "政治", "経済", "スポーツ"]);

const TECH_TAGS = new Set([
  "技術",
  "スマートフォン",
  "iPhone",
  "パソコン",
  "インターネット",
  "Windows",
]);

export type ChronicleFilterState = {
  interests: ChronicleInterestId[];
  from: string | null;
  to: string | null;
  tags: string[];
};

export function emptyChronicleFilter(): ChronicleFilterState {
  return { interests: [], ...emptyDateRange(), tags: [] };
}

export function chronicleFilterActive(filter: ChronicleFilterState): boolean {
  return (
    filter.interests.length > 0 ||
    dateRangeActive(filter) ||
    filter.tags.length > 0
  );
}

function isInterestId(value: string): value is ChronicleInterestId {
  return value === "society" || value === "tech" || value === "personal";
}

/** Parse `/chronicle/?i=&from=&to=&t=`（旧 `y=` も可） */
export function parseChronicleFilter(
  searchParams: SearchParamsRecord,
): ChronicleFilterState {
  const interests = firstSearchParamValue(searchParams, "i")
    .split(",")
    .map((part) => part.trim())
    .filter(isInterestId);
  const range = parseDateRangeFromSearchParams(searchParams, {
    legacyYearsKey: "y",
  });

  return {
    interests,
    from: range.from,
    to: range.to,
    tags: decodePipeSeparatedList(firstSearchParamValue(searchParams, "t")),
  };
}

export function serializeChronicleFilter(
  filter: ChronicleFilterState,
): string {
  const query = new URLSearchParams();
  if (filter.interests.length) {
    query.set("i", filter.interests.join(","));
  }
  appendDateRangeToQuery(query, filter);
  if (filter.tags.length) {
    query.set("t", encodePipeSeparatedList(filter.tags));
  }
  return toQueryString(query);
}

export function chronicleMatchesDateRange(
  item: { date: string },
  range: { from: string | null; to: string | null },
): boolean {
  return isoDateInRange(item.date, range);
}

export { formatDateRangeSummary };

export function chronicleYear(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    const match = /^(\d{4})/.exec(date);
    return match?.[1] ?? "";
  }
  return String(parsed.getFullYear());
}

/** `01`–`12`. Invalid dates return "". */
export function chronicleMonth(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date.slice(5, 7);
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    const match = /^\d{4}-(\d{2})/.exec(date);
    return match?.[1] ?? "";
  }
  return String(parsed.getMonth() + 1).padStart(2, "0");
}

function normalizeDateParts(date: string): {
  year: string;
  month: string;
  day: string;
} | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    return { year, month, day };
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    year: String(parsed.getFullYear()),
    month: String(parsed.getMonth() + 1).padStart(2, "0"),
    day: String(parsed.getDate()).padStart(2, "0"),
  };
}

export function formatChronicleDate(
  date: string,
  precision: ChronicleDatePrecision = "day",
): string {
  const parts = normalizeDateParts(date);
  if (!parts) return date;
  if (precision === "year") return parts.year;
  const iso =
    precision === "month"
      ? `${parts.year}-${parts.month}-01`
      : `${parts.year}-${parts.month}-${parts.day}`;
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  if (precision === "month") {
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  }
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Single day or period label for matrix / modal / detail. */
export function formatChronicleWhen(item: {
  date: string;
  date_precision?: ChronicleDatePrecision | null;
  end_date?: string | null;
}): string {
  const precision = item.date_precision ?? "day";
  const start = formatChronicleDate(item.date, precision);
  if (!item.end_date) return start;
  const endPrecision =
    precision === "day" ? "day" : precision === "month" ? "month" : "year";
  const end = formatChronicleDate(item.end_date, endPrecision);
  if (end === start) return start;
  return `${start} – ${end}`;
}

export function chronicleIsPeriod(item: {
  end_date?: string | null;
}): boolean {
  return Boolean(item.end_date);
}

export function interestLabel(id: ChronicleInterestId): string {
  return CHRONICLE_INTERESTS.find((item) => item.id === id)?.label ?? id;
}

/** Match an event against one interest lens. */
export function chronicleMatchesInterest(
  item: {
    category: string | null;
    subcategory: string | null;
    chronicle_tag: string[];
  },
  interest: ChronicleInterestId,
): boolean {
  const tags = item.chronicle_tag ?? [];
  if (interest === "society") {
    return SOCIETY_CATEGORIES.has(item.category ?? "");
  }
  if (interest === "tech") {
    if (item.subcategory === "技術") return true;
    return tags.some((tag) => TECH_TAGS.has(tag));
  }
  // personal: タグがある出来事（関心のフックがあるもの）
  return tags.length > 0;
}

export function chronicleMatchesAnyInterest(
  item: {
    category: string | null;
    subcategory: string | null;
    chronicle_tag: string[];
  },
  interests: ChronicleInterestId[],
): boolean {
  if (!interests.length) return true;
  return interests.some((interest) =>
    chronicleMatchesInterest(item, interest),
  );
}
