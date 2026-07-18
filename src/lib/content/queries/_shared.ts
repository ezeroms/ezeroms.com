import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const PUBLISHED = "published";

export function emptyList<T>(): { items: T[]; total: number } {
  return { items: [], total: 0 };
}

/** PostgREST / Postgres when migration not applied yet. */
export function isMissingRelationError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { message?: unknown; code?: unknown; details?: unknown };
  const code = String(err.code ?? "");
  const msg = `${err.message ?? ""} ${err.details ?? ""}`;
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    /schema cache|Could not find the table|relation .* does not exist/i.test(
      msg,
    )
  );
}

export function logQueryError(label: string, e: unknown) {
  if (isMissingRelationError(e)) return;
  const msg =
    e && typeof e === "object" && "message" in e
      ? String((e as { message: unknown }).message)
      : e;
  console.error(label, msg || e);
}

export { getSupabaseAdmin, hasSupabaseConfig };
