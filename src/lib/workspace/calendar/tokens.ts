import "server-only";

import { getWorkspaceAdmin } from "@/lib/workspace/db/server";
import {
  GoogleCalendarAuthError,
} from "@/lib/workspace/calendar/auth-error";
import {
  fetchGoogleAccountEmail,
  GoogleOAuthError,
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
export {
  GoogleCalendarAuthError,
  isGoogleCalendarAuthError,
} from "@/lib/workspace/calendar/auth-error";

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
  existing?: Pick<
    StoredGoogleToken,
    "refresh_token" | "google_email" | "scope"
  > | null,
): Promise<StoredGoogleToken> {
  const refresh = tokens.refresh_token ?? existing?.refresh_token ?? null;
  const expiryAt =
    typeof tokens.expires_in === "number"
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;
  const email =
    (await fetchGoogleAccountEmail(tokens.access_token)) ??
    existing?.google_email ??
    null;

  const { data, error } = await getWorkspaceAdmin()
    .from("google_oauth_tokens")
    .upsert(
      {
        id: "default",
        google_email: email,
        access_token: tokens.access_token,
        refresh_token: refresh,
        scope: tokens.scope ?? existing?.scope ?? null,
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

type AccessTokenResult = {
  accessToken: string;
  email: string | null;
};

const REFRESH_SKEW_MS = 60_000;
const RECENT_REFRESH_MS = 30_000;

/** One in-flight refresh per process so parallel Calendar API calls share it. */
let refreshInFlight: Promise<AccessTokenResult> | null = null;

function tokenStillFresh(stored: StoredGoogleToken, skewMs = REFRESH_SKEW_MS): boolean {
  if (!stored.expiry_at) return false;
  return new Date(stored.expiry_at).getTime() >= Date.now() + skewMs;
}

function recentlyUpdated(stored: StoredGoogleToken): boolean {
  return new Date(stored.updated_at).getTime() > Date.now() - RECENT_REFRESH_MS;
}

function throwReconnect(error: unknown): never {
  const detail = error instanceof Error ? error.message : undefined;
  throw new GoogleCalendarAuthError(
    detail
      ? `Googleカレンダーの再認証に失敗しました（${detail}）。カレンダー画面から再接続してください。`
      : undefined,
  );
}

async function refreshStoredGoogleToken(
  stored: StoredGoogleToken,
): Promise<AccessTokenResult> {
  if (!stored.refresh_token) {
    throw new GoogleCalendarAuthError();
  }

  try {
    const refreshed = await refreshAccessToken(stored.refresh_token);
    const updated = await upsertGoogleTokens(refreshed, stored);
    return { accessToken: updated.access_token, email: updated.google_email };
  } catch (error) {
    if (error instanceof GoogleCalendarAuthError) throw error;

    const latest = await getStoredGoogleToken();
    if (
      latest &&
      latest.access_token !== stored.access_token &&
      recentlyUpdated(latest) &&
      tokenStillFresh(latest, 0)
    ) {
      return { accessToken: latest.access_token, email: latest.google_email };
    }

    if (error instanceof GoogleOAuthError && error.isTransient) {
      throw new Error(
        `Googleトークンの更新が一時的に失敗しました（${error.message}）。しばらくして再試行してください。`,
      );
    }

    throwReconnect(error);
  }
}

/**
 * Returns a valid access token, refreshing when needed. Never return to client.
 * @param forceRefresh — ignore expiry and refresh (e.g. after Google 401).
 */
export async function getValidGoogleAccessToken(opts?: {
  forceRefresh?: boolean;
}): Promise<AccessTokenResult | null> {
  const stored = await getStoredGoogleToken();
  if (!stored) return null;

  if (!opts?.forceRefresh && tokenStillFresh(stored)) {
    return { accessToken: stored.access_token, email: stored.google_email };
  }

  if (!stored.refresh_token) {
    if (tokenStillFresh(stored, 0)) {
      return { accessToken: stored.access_token, email: stored.google_email };
    }
    throw new GoogleCalendarAuthError();
  }

  if (refreshInFlight) {
    if (!opts?.forceRefresh) return refreshInFlight;
    try {
      await refreshInFlight;
    } catch {
      // Dead refresh token or transient failure; try again below.
    }
    if (refreshInFlight) return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const latest = await getStoredGoogleToken();
      if (!latest) throw new GoogleCalendarAuthError();
      if (!opts?.forceRefresh && tokenStillFresh(latest)) {
        return { accessToken: latest.access_token, email: latest.google_email };
      }
      return await refreshStoredGoogleToken(latest);
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
