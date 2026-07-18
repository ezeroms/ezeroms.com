/**
 * After applying supabase/migrations/20260719030000_photo_galleries_safe.sql:
 * 1) Copy rows from legacy `snap` → `smile`
 * 2) Upsert local Markdown into smile / jumpai
 *
 * Usage: npx tsx scripts/admin/setup-photo-galleries.ts
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { spawnSync } from "node:child_process";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function tableExists(table: string): Promise<boolean> {
  const { error } = await sb.from(table).select("id", { head: true, count: "exact" });
  return !error;
}

async function copySnapToSmile() {
  const { data: rows, error } = await sb.from("snap").select("*");
  if (error) {
    console.warn("  skip snap→smile:", error.message);
    return;
  }
  if (!rows?.length) {
    console.log("  snap is empty");
    return;
  }

  const payload = rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    date: row.date,
    location: row.location,
    camera: row.camera,
    image_url: row.image_url,
    image_thumb_url: null,
    photo_tag: [],
    body_html: row.body_html ?? "",
    status: row.status ?? "published",
    published_at: row.published_at ?? row.date,
  }));

  const { error: upsertError } = await sb
    .from("smile")
    .upsert(payload, { onConflict: "slug" });
  if (upsertError) throw new Error(upsertError.message);
  console.log(`  ✓ copied ${payload.length} rows snap → smile`);
}

function runMigrate(name: string) {
  const result = spawnSync(
    "npx",
    ["tsx", "scripts/migrate-to-supabase/index.ts", name],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.status !== 0) {
    throw new Error(`migrate ${name} failed`);
  }
}

async function main() {
  console.log("Checking photo gallery tables…\n");
  const smileOk = await tableExists("smile");
  const jumpaiOk = await tableExists("jumpai");
  const kuikakeOk = await tableExists("kuikake");

  if (!smileOk || !jumpaiOk || !kuikakeOk) {
    console.error("Missing tables:");
    if (!smileOk) console.error("  - smile");
    if (!jumpaiOk) console.error("  - jumpai");
    if (!kuikakeOk) console.error("  - kuikake");
    console.error(
      "\nApply supabase/migrations/20260719030000_photo_galleries_safe.sql in the Supabase SQL Editor, then re-run this script.",
    );
    process.exit(1);
  }

  console.log("Copying legacy snap → smile…");
  await copySnapToSmile();

  console.log("\nMigrating local Markdown…");
  runMigrate("smile");
  runMigrate("jumpai");
  runMigrate("kuikake");

  console.log("\nDone. Admin Photos should now read from smile / jumpai / kuikake.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
