/**
 * Fix over-escaped column Markdown (Contentful export) and re-write body_html in Supabase.
 *
 * Usage: npx tsx scripts/repair-column-legacy-markdown.ts
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import matter from "gray-matter";
import dotenv from "dotenv";
import {
  legacyMarkdownToHtml,
  normalizeLegacyMarkdown,
  unescapeOverEscapedMarkdown,
} from "../src/lib/content/legacy-markdown";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const ROOT = process.cwd();
const COLUMN_DIR = path.join(ROOT, "content", "column");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function needsRepair(md: string): boolean {
  return (
    /\\[!#*`>[\]_()|]/.test(md) ||
    /\\[-]/.test(md) ||
    md.includes("\\*") ||
    md.includes("\\[") ||
    md.includes("\\!")
  );
}

async function main() {
  const files = fs
    .readdirSync(COLUMN_DIR)
    .filter((name) => name.endsWith(".md") && name !== "_index.md")
    .map((name) => path.join(COLUMN_DIR, name));

  let fixedFiles = 0;
  let updatedRows = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = matter(raw);
    const originalBody = parsed.content;

    if (!needsRepair(originalBody) && !originalBody.includes("######")) {
      continue;
    }

    const fixedBody = normalizeLegacyMarkdown(
      unescapeOverEscapedMarkdown(originalBody),
    );
    if (fixedBody === originalBody.trim() + (originalBody.endsWith("\n") ? "\n" : "")) {
      // still rewrite HTML from current body
    }

    const nextFile = matter.stringify(fixedBody.replace(/^\n+/, ""), parsed.data);
    fs.writeFileSync(file, nextFile.endsWith("\n") ? nextFile : `${nextFile}\n`, "utf8");
    fixedFiles += 1;

    const slug =
      String(parsed.data.slug ?? path.basename(file, ".md")).trim() ||
      path.basename(file, ".md");
    const bodyHtml = legacyMarkdownToHtml(fixedBody);

    const { error } = await sb
      .from("column")
      .update({ body_html: bodyHtml, updated_at: new Date().toISOString() })
      .eq("slug", slug);

    if (error) {
      console.error(`DB update failed for ${slug}:`, error.message);
      continue;
    }
    updatedRows += 1;
    console.log(`✓ ${slug}`);
  }

  console.log(`\nFixed ${fixedFiles} markdown files, updated ${updatedRows} DB rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
