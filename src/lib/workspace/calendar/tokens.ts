import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import {
  fetchGoogleAccountEmail,
  refreshAccessToken,
  type GoogleTokenResponse,
} from "@/lib/workspace/calendar/oauth";

export type { WeekStartsOn } from "@/lib/workspace/calendar/time";
export {
  type CalendarPreferences,
  getCalendarPreferences,
  updateCalendarPreferences,
  setHiddenCalendarIds,
  setWritableCalendarId,
  setWeekStartsOn,
  setDayStartsHour,
  setTimezonePreferences,
} from "@/lib/workspace/calendar/prefs";

export type StoredGoogleToken = {
  id: string;
  google_email: string | null;
  access_token: string;
  refresh_token: string | null;
  scope: string | null;
  token_type: string | null;
  expiry_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getStoredGoogleToken(): Promise<StoredGoogleToken | null> {
  const { data, error } = await getWorkspaceAdmin()
    .from("google_oauth_tokens")
    .select(
      "id, google_email, access_token, refresh_token, scope, token_type, expiry_at, created_at, updated_at",
    )
    .eq("id", "default")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as StoredGoogleToken | null) ?? null;
}

export async function upsertGoogleTokens(
  tokens: GoogleTokenResponse,
  existingRefresh?: string | null,
): Promise<StoredGoogleToken> {
  const refresh = tokens.refresh_token ?? existingRefresh ?? null;
  const expiryAt =
    typeof tokens.expires_in === "number"
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;
  const email = await fetchGoogleAccountEmail(tokens.access_token);

  const { data, error } = await getWorkspaceAdmin()
    .from("google_oauth_tokens")
    .upsert(
      {
        id: "default",
        google_email: email,
        access_token: tokens.access_token,
        refresh_token: refresh,
        scope: tokens.scope ?? null,
        token_type: tokens.token_type ?? "Bearer",
        expiry_at: expiryAt,
      },
      { onConflict: "id" },
    )
    .select(
      "id, google_email, access_token, refresh_token, scope, token_type, expiry_at, created_at, updated_at",
    )
    .single();
  if (error) throw new Error(error.message);
  return data as StoredGoogleToken;
}

export async function deleteGoogleTokens(): Promise<void> {
  const { error } = await getWorkspaceAdmin()
    .from("google_oauth_tokens")
    .delete()
    .eq("id", "default");
  if (error) throw new Error(error.message);
}

/** Returns a valid access token, refreshing when needed. Never return to client. */
export async function getValidGoogleAccessToken(): Promise<{
  accessToken: string;
  email: string | null;
} | null> {
  const stored = await getStoredGoogleToken();
  if (!stored) return null;

  const expiryMs = stored.expiry_at
    ? new Date(stored.expiry_at).getTime()
    : 0;
  const needsRefresh = !expiryMs || expiryMs < Date.now() + 60_000;

  if (!needsRefresh) {
    return { accessToken: stored.access_token, email: stored.google_email };
  }

  if (!stored.refresh_token) {
    return { accessToken: stored.access_token, email: stored.google_email };
  }

  const refreshed = await refreshAccessToken(stored.refresh_token);
  const updated = await upsertGoogleTokens(refreshed, stored.refresh_token);
  return { accessToken: updated.access_token, email: updated.google_email };
}
