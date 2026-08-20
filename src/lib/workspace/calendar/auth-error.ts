export const GOOGLE_CALENDAR_OAUTH_START_PATH =
  "/api/admin/workspace/calendar/oauth/start/";

/** Thrown when stored Google credentials are unusable and the user must reconnect. */
export class GoogleCalendarAuthError extends Error {
  constructor(
    message = "Googleカレンダーの認証が切れています。カレンダー画面から再接続してください。",
  ) {
    super(message);
    this.name = "GoogleCalendarAuthError";
  }
}

export function googleCalendarMessageNeedsReconnect(
  message: string | null | undefined,
): boolean {
  if (!message) return false;
  const msg = message.toLowerCase();
  return (
    msg.includes("invalid authentication") ||
    msg.includes("invalid_grant") ||
    msg.includes("unauthorized") ||
    /\b401\b/.test(msg) ||
    message.includes("再接続") ||
    message.includes("再認証")
  );
}

export function isGoogleCalendarAuthError(error: unknown): boolean {
  if (error instanceof GoogleCalendarAuthError) return true;
  if (!(error instanceof Error)) return false;
  return googleCalendarMessageNeedsReconnect(error.message);
}
