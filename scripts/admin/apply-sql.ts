/**
 * Apply a SQL migration via Supabase Management API or direct Postgres.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=… npx tsx scripts/admin/apply-sql.ts path/to.sql
 *   # or DATABASE_URL / SUPABASE_DB_PASSWORD
 */
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: npx tsx scripts/admin/apply-sql.ts <path-to.sql>");
  process.exit(1);
}

const sqlPath = path.resolve(fileArg);
const sql = fs.readFileSync(sqlPath, "utf8");
const projectRef =
  process.env.SUPABASE_PROJECT_REF ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/^https?:\/\//, "")
    .split(".")[0];

async function viaPostgres(): Promise<boolean> {
  const url =
    process.env.DATABASE_URL ||
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
    console.log(`Applied via Postgres: ${sqlPath}`);
    return true;
  } finally {
    await client.end();
  }
}

async function viaManagementApi(): Promise<boolean> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token || !projectRef) return false;

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${text}`);
  }
  console.log(`Applied via Management API: ${sqlPath}`);
  if (text) console.log(text.slice(0, 800));
  return true;
}

async function main() {
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
    "Could not apply SQL. Set SUPABASE_ACCESS_TOKEN, or DATABASE_URL / SUPABASE_DB_PASSWORD.",
  );
  process.exit(1);
}

main();
