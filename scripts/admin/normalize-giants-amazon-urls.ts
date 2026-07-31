/**
 * Giants の source_url に残っている Amazon 短縮 URL（amzn.asia / amzn.to）を
 * https://www.amazon.co.jp/dp/{ASIN} 形式へ正規化する。
 *
 * Usage:
 *   npx tsx scripts/admin/normalize-giants-amazon-urls.ts
 *   npx tsx scripts/admin/normalize-giants-amazon-urls.ts --dry-run
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import {
  isAmazonShortUrl,
  normalizePurchaseUrl,
} from "../../src/lib/affiliate/amazon";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required");
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db
    .from("shoulders_of_giants")
    .select("slug, source_url")
    .not("source_url", "is", null);

  if (error) throw error;

  const rows = (data ?? []).filter(
    (r) => typeof r.source_url === "string" && isAmazonShortUrl(r.source_url),
  );

  console.log(
    `${dryRun ? "[dry-run] " : ""}short URLs to normalize: ${rows.length}`,
  );

  // 同一短縮 URL は一度だけ解決して使い回す
  const byShort = new Map<string, typeof rows>();
  for (const row of rows) {
    const short = String(row.source_url).trim();
    const list = byShort.get(short) ?? [];
    list.push(row);
    byShort.set(short, list);
  }

  let updated = 0;
  let failed = 0;

  for (const [short, group] of byShort) {
    const normalized = await normalizePurchaseUrl(short);
    if (normalized.error || !normalized.value) {
      console.error(`FAIL ${short}: ${normalized.error ?? "empty"}`);
      failed += group.length;
      continue;
    }

    console.log(`${short} → ${normalized.value} (${group.length} rows)`);

    if (dryRun) {
      updated += group.length;
      continue;
    }

    const slugs = group.map((r) => r.slug as string);
    const { error: updateError } = await db
      .from("shoulders_of_giants")
      .update({
        source_url: normalized.value,
        updated_at: new Date().toISOString(),
      })
      .in("slug", slugs);

    if (updateError) {
      console.error(`UPDATE FAIL ${short}: ${updateError.message}`);
      failed += group.length;
      continue;
    }
    updated += group.length;
  }

  console.log(`done. updated=${updated} failed=${failed}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
