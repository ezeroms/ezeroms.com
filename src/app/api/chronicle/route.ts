import { listChronicle } from "@/lib/content/queries";
import { jsonError, jsonNoStore } from "@/lib/api";
import type { ChronicleInterestId } from "@/lib/content/chronicle-filter";

function parseInterests(raw: string | null): ChronicleInterestId[] | undefined {
  if (!raw) return undefined;
  const allowed = new Set(["society", "tech", "personal"]);
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ChronicleInterestId => allowed.has(s));
  return list.length ? list : undefined;
}

/** App-like chronicle filters: always fresh */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tagsParam = searchParams.get("tags") ?? searchParams.get("t");
    const tags = tagsParam
      ? tagsParam
          .split(/[,|]/)
          .map((t) => {
            try {
              return decodeURIComponent(t.trim());
            } catch {
              return t.trim();
            }
          })
          .filter(Boolean)
      : undefined;
    const yearsParam = searchParams.get("years") ?? searchParams.get("y");
    const years = yearsParam
      ? yearsParam
          .split(",")
          .map((s) => s.trim())
          .filter((s) => /^\d{4}$/.test(s))
      : undefined;
    const data = await listChronicle({
      start: searchParams.get("start") ?? undefined,
      end: searchParams.get("end") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      tags,
      years,
      interests: parseInterests(
        searchParams.get("interests") ?? searchParams.get("i"),
      ),
    });
    return jsonNoStore(data);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to list chronicle",
    );
  }
}
