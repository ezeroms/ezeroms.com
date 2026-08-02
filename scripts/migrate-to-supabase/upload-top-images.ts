/**
 * Upload static/images/top → Supabase Storage (media/top/)
 * and insert rows into top_image.
 *
 * Prerequisites:
 *   - Run supabase/migrations/20260716120100_storage_media.sql
 *   - Run supabase/migrations/20260717010000_top_image.sql
 *
 * Usage: npx tsx scripts/migrate-to-supabase/upload-top-images.ts
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ROOT = process.cwd();
const DIRS = [
  path.join(ROOT, "public/images/top"),
  path.join(ROOT, "static/images/top"),
];

function findDir() {
  for (const d of DIRS) {
    if (fs.existsSync(d)) return d;
  }
  return null;
}

function contentType(file: string) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".webp") return "image/webp";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

async function ensureBucket() {
  const { data } = await sb.storage.listBuckets();
  if (data?.some((b) => b.id === "media" || b.name === "media")) return;
  const { error } = await sb.storage.createBucket("media", { public: true });
  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
}

async function main() {
  const dir = findDir();
  if (!dir) {
    console.error("No top images directory found");
    process.exit(1);
  }

  await ensureBucket();

  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(webp|jpg|jpeg|png|gif)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  console.log(`Uploading ${files.length} images from ${dir}…`);

  const rows: Record<string, unknown>[] = [];
  let i = 0;
  for (const file of files) {
    i += 1;
    const local = path.join(dir, file);
    const body = fs.readFileSync(local);
    const objectPath = `top/${file}`;
    const { error: upErr } = await sb.storage
      .from("media")
      .upload(objectPath, body, {
        contentType: contentType(file),
        upsert: true,
      });
    if (upErr) {
      console.error(`  ✗ ${file}: ${upErr.message}`);
      continue;
    }
    const { data: pub } = sb.storage.from("media").getPublicUrl(objectPath);
    const slug = path.basename(file, path.extname(file));
    rows.push({
      slug,
      image_url: pub.publicUrl,
      alt: "Random Image",
      sort_order: i,
      status: "published",
      published_at: new Date().toISOString(),
    });
    console.log(`  ✓ ${file}`);
  }

  if (!rows.length) {
    console.error("No rows to upsert");
    process.exit(1);
  }

  const { error } = await sb.from("top_image").upsert(rows, { onConflict: "slug" });
  if (error) {
    console.error("DB upsert failed:", error.message);
    console.error("Did you run 20260717010000_top_image.sql ?");
    process.exit(1);
  }
  console.log(`\nDone. ${rows.length} top_image rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
