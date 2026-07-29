import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";

export const PUBLISHED = "published";

export function emptyList<T>(): { items: T[]; total: number } {
  return { items: [], total: 0 };
}

/** PostgREST / Postgres when migration not applied yet (missing table). */
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

/** PostgREST / Postgres when a selected column isn't migrated yet. */
export function isMissingColumnError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as {
    message?: unknown;
    code?: unknown;
    details?: unknown;
    hint?: unknown;
  };
  const code = String(err.code ?? "");
  const msg = `${err.message ?? ""} ${err.details ?? ""} ${err.hint ?? ""}`;
  return (
    code === "42703" ||
    code === "PGRST204" ||
    /column .* does not exist/i.test(msg)
  );
}

/** Table or column not ready — safe to fall back silently. */
export function isSchemaNotReadyError(e: unknown): boolean {
  return isMissingRelationError(e) || isMissingColumnError(e);
}

export function logQueryError(label: string, e: unknown) {
  if (isSchemaNotReadyError(e)) return;
  const msg =
    e && typeof e === "object" && "message" in e
      ? String((e as { message: unknown }).message)
      : e;
  console.error(label, msg || e);
}

export { getSupabaseAdmin, hasSupabaseConfig };
