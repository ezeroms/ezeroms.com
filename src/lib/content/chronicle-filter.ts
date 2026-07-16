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
  years: string[];
  tags: string[];
};

export function emptyChronicleFilter(): ChronicleFilterState {
  return { interests: [], years: [], tags: [] };
}

export function chronicleFilterActive(f: ChronicleFilterState): boolean {
  return (
    f.interests.length > 0 || f.years.length > 0 || f.tags.length > 0
  );
}

function one(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function decodeList(raw: string): string[] {
  return raw
    .split("|")
    .map((s) => {
      try {
        return decodeURIComponent(s.trim());
      } catch {
        return s.trim();
      }
    })
    .filter(Boolean);
}

function isInterestId(v: string): v is ChronicleInterestId {
  return v === "society" || v === "tech" || v === "personal";
}

/** Parse `/chronicle/?i=&y=&t=` */
export function parseChronicleFilter(
  sp: Record<string, string | string[] | undefined>,
): ChronicleFilterState {
  const interests = one(sp, "i")
    .split(",")
    .map((s) => s.trim())
    .filter(isInterestId);
  const years = one(sp, "y")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}$/.test(s));
  return {
    interests,
    years,
    tags: decodeList(one(sp, "t")),
  };
}

export function serializeChronicleFilter(f: ChronicleFilterState): string {
  const q = new URLSearchParams();
  if (f.interests.length) q.set("i", f.interests.join(","));
  if (f.years.length) q.set("y", f.years.join(","));
  if (f.tags.length) {
    q.set("t", f.tags.map((t) => encodeURIComponent(t)).join("|"));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function chronicleYear(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    const m = /^(\d{4})/.exec(date);
    return m?.[1] ?? "";
  }
  return String(d.getFullYear());
}

export function formatChronicleDate(date: string): string {
  // Prefer date-only strings as-is when already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-");
    return `${y}/${m}/${d}`;
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function interestLabel(id: ChronicleInterestId): string {
  return CHRONICLE_INTERESTS.find((i) => i.id === id)?.label ?? id;
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
    return tags.some((t) => TECH_TAGS.has(t));
  }
  // personal: theme-driven — events that carry tags (関心のフックがあるもの)
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
  return interests.some((i) => chronicleMatchesInterest(item, i));
}
