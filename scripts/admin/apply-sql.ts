/**
 * Apply a SQL migration via Supabase Management API or direct Postgres.
 *
 * Usage:
 *   npx tsx scripts/admin/apply-sql.ts path/to.sql
 *   npx tsx scripts/admin/apply-sql.ts --workspace path/to.sql
 *   # or DATABASE_URL / SUPABASE_DB_PASSWORD / WORKSPACE_DATABASE_URL
 */
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const args = process.argv.slice(2);
const workspace = args.includes("--workspace");
const fileArg = args.find((a) => a !== "--workspace");

if (!fileArg) {
  console.error(
    "Usage: npx tsx scripts/admin/apply-sql.ts [--workspace] <path-to.sql>",
  );
  process.exit(1);
}

const sqlPath = path.resolve(fileArg);
const sql = fs.readFileSync(sqlPath, "utf8");

const siteUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const workspaceUrl = process.env.WORKSPACE_SUPABASE_URL ?? "";

const projectRef = workspace
  ? process.env.WORKSPACE_PROJECT_REF ||
    workspaceUrl.replace(/^https?:\/\//, "").split(".")[0]
  : process.env.SUPABASE_PROJECT_REF ||
    siteUrl.replace(/^https?:\/\//, "").split(".")[0];

const accessToken = workspace
  ? process.env.WORKSPACE_SUPABASE_ACCESS_TOKEN ||
    process.env.SUPABASE_ACCESS_TOKEN
  : process.env.SUPABASE_ACCESS_TOKEN;

async function viaPostgres(): Promise<boolean> {
  const url = workspace
    ? process.env.WORKSPACE_DATABASE_URL ||
      process.env.WORKSPACE_SUPABASE_DB_URL ||
      (process.env.WORKSPACE_SUPABASE_DB_PASSWORD && projectRef
        ? `postgresql://postgres.${projectRef}:${encodeURIComponent(process.env.WORKSPACE_SUPABASE_DB_PASSWORD)}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`
        : null)
    : process.env.DATABASE_URL ||
      process.env.SUPABASE_DB_URL ||
      (process.env.SUPABASE_DB_PASSWORD && projectRef
        ? `postgresql://postgres.${projectRef}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`
        : null);
  if (!url) return false;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pg = require("pg") as {
    Client: new (config: {
      connectionString: string;
      ssl?: { rejectUnauthorized: boolean };
    }) => {
      connect: () => Promise<void>;
      query: (sql: string) => Promise<unknown>;
      end: () => Promise<void>;
    };
  };
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log(
      `Applied via Postgres${workspace ? " (workspace)" : ""}: ${sqlPath}`,
    );
    return true;
  } finally {
    await client.end();
  }
}

async function viaManagementApi(): Promise<boolean> {
  if (!accessToken || !projectRef) return false;

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${text}`);
  }
  console.log(
    `Applied via Management API${workspace ? " (workspace)" : ""}: ${sqlPath} (ref=${projectRef})`,
  );
  if (text) console.log(text.slice(0, 800));
  return true;
}

async function main() {
  if (workspace && !workspaceUrl && !process.env.WORKSPACE_PROJECT_REF) {
    console.warn(
      "Warning: WORKSPACE_SUPABASE_URL / WORKSPACE_PROJECT_REF not set.",
    );
  }

  try {
    if (await viaManagementApi()) return;
  } catch (e) {
    console.warn(
      "Management API path failed:",
      e instanceof Error ? e.message : e,
    );
  }
  try {
    if (await viaPostgres()) return;
  } catch (e) {
    console.warn("Postgres path failed:", e instanceof Error ? e.message : e);
  }
  console.error(
    workspace
      ? "Could not apply Workspace SQL. Set SUPABASE_ACCESS_TOKEN (or WORKSPACE_SUPABASE_ACCESS_TOKEN) and WORKSPACE_SUPABASE_URL, or WORKSPACE_DATABASE_URL."
      : "Could not apply SQL. Set SUPABASE_ACCESS_TOKEN, or DATABASE_URL / SUPABASE_DB_PASSWORD.",
  );
  process.exit(1);
}

main();
