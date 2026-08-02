import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Resolve Workspace DB credentials.
 * Default: same Supabase project as the site (NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY). Optional WORKSPACE_* overrides for a separate project.
 */
function resolveWorkspaceCredentials(): {
  url: string | undefined;
  key: string | undefined;
  source: "workspace" | "site" | "none";
} {
  const workspaceUrl = process.env.WORKSPACE_SUPABASE_URL?.trim();
  const workspaceKey = process.env.WORKSPACE_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (workspaceUrl && workspaceKey) {
    return { url: workspaceUrl, key: workspaceKey, source: "workspace" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (siteUrl && siteKey) {
    return { url: siteUrl, key: siteKey, source: "site" };
  }

  return { url: undefined, key: undefined, source: "none" };
}

/** Workspace DB reachable (explicit WORKSPACE_* or shared site Supabase). */
export function hasWorkspaceConfig(): boolean {
  return resolveWorkspaceCredentials().source !== "none";
}

/**
 * Server-only Workspace Supabase client (service role).
 * Do not import from Client Components or public site code.
 */
export function getWorkspaceAdmin(): SupabaseClient {
  const { url, key, source } = resolveWorkspaceCredentials();
  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials for Workspace. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (same project), or WORKSPACE_SUPABASE_URL and WORKSPACE_SUPABASE_SERVICE_ROLE_KEY. See ENV_SETUP.md",
    );
  }
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    if (process.env.NODE_ENV === "development" && source === "site") {
      // Helpful when debugging which project Workspace is using.
      console.info(
        "[workspace] Using site Supabase project (same-project mode)",
      );
    }
  }
  return client;
}
