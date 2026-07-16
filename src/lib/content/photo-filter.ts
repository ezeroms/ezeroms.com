export type PhotoFilterState = {
  years: string[];
  tags: string[];
};

export function emptyPhotoFilter(): PhotoFilterState {
  return { years: [], tags: [] };
}

export function photoFilterActive(f: PhotoFilterState): boolean {
  return f.years.length > 0;
}

function one(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

/** Parse `/?y=` (tags removed for Smile / Jumpai). */
export function parsePhotoFilter(
  sp: Record<string, string | string[] | undefined>,
): PhotoFilterState {
  const years = one(sp, "y")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}$/.test(s));
  return {
    years,
    tags: [],
  };
}

export function serializePhotoFilter(f: PhotoFilterState): string {
  const q = new URLSearchParams();
  if (f.years.length) q.set("y", f.years.join(","));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function photoYear(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getFullYear());
}

export function formatPhotoDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
