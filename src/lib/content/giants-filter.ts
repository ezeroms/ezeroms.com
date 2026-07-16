export type GiantsFilterState = {
  topics: string[];
};

export function emptyGiantsFilter(): GiantsFilterState {
  return { topics: [] };
}

export function giantsFilterActive(f: GiantsFilterState): boolean {
  return f.topics.length > 0;
}

function decodePipeList(raw: string): string[] {
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

/**
 * Parse `/shoulders-of-giants/?t=topic1|topic2`
 * Also accepts legacy `?topic=` (single).
 */
export function parseGiantsFilter(
  sp: Record<string, string | string[] | undefined>,
): GiantsFilterState {
  const one = (key: string) => {
    const v = sp[key];
    if (Array.isArray(v)) return v[0] ?? "";
    return v ?? "";
  };
  const fromT = decodePipeList(one("t"));
  if (fromT.length) return { topics: fromT };

  const legacy = one("topic").trim();
  if (legacy) {
    try {
      return { topics: [decodeURIComponent(legacy)] };
    } catch {
      return { topics: [legacy] };
    }
  }
  return emptyGiantsFilter();
}

export function serializeGiantsFilter(f: GiantsFilterState): string {
  if (!f.topics.length) return "";
  const q = new URLSearchParams();
  q.set("t", f.topics.map((t) => encodeURIComponent(t)).join("|"));
  return `?${q.toString()}`;
}
