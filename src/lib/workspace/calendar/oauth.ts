import "server-only";

export const GOOGLE_CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

/** Create/update events (used with readonly for list + write). */
export const GOOGLE_CALENDAR_EVENTS_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";

export const GOOGLE_CALENDAR_SCOPES = [
  GOOGLE_CALENDAR_READONLY_SCOPE,
  GOOGLE_CALENDAR_EVENTS_SCOPE,
].join(" ");

export function tokenHasCalendarWriteScope(scope: string | null | undefined): boolean {
  if (!scope) return false;
  const parts = scope.split(/\s+/);
  return (
    parts.includes(GOOGLE_CALENDAR_EVENTS_SCOPE) ||
    parts.includes("https://www.googleapis.com/auth/calendar")
  );
}

export function hasGoogleCalendarOAuthConfig(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function getGoogleOAuthRedirectUri(): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${site}/api/admin/workspace/calendar/oauth/callback/`;
}

export function getGoogleOAuthClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. See ENV_SETUP.md",
    );
  }
  return {
    clientId,
    clientSecret,
    redirectUri: getGoogleOAuthRedirectUri(),
  };
}

export function buildGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = getGoogleOAuthClientConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

type GoogleTokenErrorBody = {
  error?: string;
  error_description?: string;
};

/** Token endpoint failure. `invalid_grant` means the refresh token is dead. */
export class GoogleOAuthError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, description?: string) {
    super(description ? `${code}: ${description}` : code);
    this.name = "GoogleOAuthError";
    this.code = code;
    this.status = status;
  }

  get isInvalidGrant(): boolean {
    return this.code === "invalid_grant";
  }

  get isTransient(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

async function readTokenResponse(
  res: Response,
  fallback: string,
): Promise<GoogleTokenResponse> {
  const data = (await res.json()) as GoogleTokenResponse & GoogleTokenErrorBody;
  if (!res.ok || !data.access_token) {
    throw new GoogleOAuthError(
      data.error || fallback,
      res.status,
      data.error_description,
    );
  }
  return data;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthClientConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  return readTokenResponse(res, "token_exchange_failed");
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getGoogleOAuthClientConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return readTokenResponse(res, "token_refresh_failed");
}

export async function fetchGoogleAccountEmail(
  accessToken: string,
): Promise<string | null> {
  const res = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}
