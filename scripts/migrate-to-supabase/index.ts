/**
 * Migrate local Markdown (+ optional Contentful) into Supabase.
 *
 * Prerequisites:
 *   - Apply supabase/migrations/*.sql in Supabase SQL Editor
 *   - Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage: npm run migrate:supabase
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import matter from "gray-matter";
import { marked } from "marked";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function mdToHtml(md: string): string {
  let src = md;
  src = src.replace(
    /\[\]\(youtube:([A-Za-z0-9_-]+)\)/g,
    (_m, id) =>
      `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen loading="lazy"></iframe>`,
  );
  src = src.replace(
    /\[\]\(spotify:(track|album|playlist)\/([A-Za-z0-9]+)\)/g,
    (_m, type, id) =>
      `<iframe src="https://open.spotify.com/embed/${type}/${id}" height="152" allow="encrypted-media"></iframe>`,
  );
  return marked.parse(src, { async: false }) as string;
}

function listMdFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMdFiles(full));
    else if (entry.name.endsWith(".md") && entry.name !== "_index.md") {
      out.push(full);
    }
  }
  return out;
}

function readEntry(file: string) {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  return { data: data as Record<string, unknown>, content, file };
}

function asStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return [String(v)];
}

/** Normalize diary_month terms: 2025/11/08 → 2025-11 */
function normalizeDiaryMonths(v: unknown): string[] {
  return asStringArray(v).map((m) => {
    const slash = m.trim().match(/^(\d{4})\/(\d{1,2})(?:\/\d{1,2})?$/);
    if (slash) return `${slash[1]}-${slash[2].padStart(2, "0")}`;
    return m.trim();
  });
}

function toDateOnly(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function toIso(v: unknown, fallback = new Date()): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
  if (v != null && v !== "") {
    const d = new Date(String(v));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallback.toISOString();
}

function slugFromFile(file: string, data: Record<string, unknown>) {
  if (typeof data.slug === "string" && data.slug) return data.slug;
  return path.basename(file, ".md");
}

async function upsert(table: string, rows: Record<string, unknown>[], onConflict = "slug") {
  if (!rows.length) return;
  const { error } = await sb.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ✓ ${table}: ${rows.length}`);
}

async function migrateAbout() {
  const rows = [];
  for (const file of listMdFiles(path.join(CONTENT, "about"))) {
    if (file.includes("media-coverage")) continue;
    const { data, content } = readEntry(file);
    const slug = slugFromFile(file, data);
    rows.push({
      slug,
      title: String(data.title ?? slug),
      body_html: mdToHtml(content),
      status: "published",
      published_at: new Date().toISOString(),
    });
  }
  await upsert("about", rows);
}

async function migrateMediaCoverage() {
  const dir = path.join(CONTENT, "about", "media-coverage");
  const rows = [];
  for (const file of listMdFiles(dir)) {
    const { data, content } = readEntry(file);
    const slug = slugFromFile(file, data);
    rows.push({
      slug,
      title: String(data.title ?? slug),
      date: toDateOnly(data.date),
      lead: data.lead ? String(data.lead) : null,
      external_url: data.external_url ? String(data.external_url) : null,
      body_html: mdToHtml(content),
      status: "published",
      published_at: toIso(data.date),
    });
  }
  await upsert("media_coverage", rows);
}

async function migrateDiary() {
  const rows = [];
  for (const file of listMdFiles(path.join(CONTENT, "diary"))) {
    const { data, content } = readEntry(file);
    const slug = slugFromFile(file, data);
    const date = toIso(data.date);
    rows.push({
      slug,
      date,
      diary_month: normalizeDiaryMonths(data.diary_month),
      diary_tag: asStringArray(data.diary_tag),
      diary_place: data.diary_place ? String(data.diary_place) : null,
      body_html: mdToHtml(content),
      status: "published",
      published_at: date,
    });
  }
  await upsert("diary", rows);
}

async function migrateColumn() {
  const rows = [];
  for (const file of listMdFiles(path.join(CONTENT, "column"))) {
    const { data, content } = readEntry(file);
    const slug = slugFromFile(file, data);
    const date = toIso(data.date);
    rows.push({
      slug,
      title: String(data.title ?? slug),
      date,
      column_month: asStringArray(data.column_month),
      column_category: asStringArray(data.column_category),
      column_tag: asStringArray(data.column_tag),
      body_html: mdToHtml(content),
      status: "published",
      published_at: date,
    });
  }
  await upsert("column", rows);
}

async function migrateWork() {
  const rows = [];
  for (const file of listMdFiles(path.join(CONTENT, "work"))) {
    const { data, content } = readEntry(file);
    if (data.layout === "list") continue;
    const slug = slugFromFile(file, data);
    const date = toIso(data.date);
    rows.push({
      slug,
      title: String(data.title ?? slug),
      date,
      image_url: data.image ? String(data.image) : null,
      start_date: toDateOnly(data.start_date),
      end_date: toDateOnly(data.end_date),
      work_category: asStringArray(data.work_category),
      work_tag: asStringArray(data.work_tag),
      role: data.role ? String(data.role) : null,
      client: data.client ? String(data.client) : null,
      agency: data.agency ? String(data.agency) : null,
      body_html: mdToHtml(content),
      status: "published",
      published_at: date,
    });
  }
  await upsert("work", rows);
}

async function migrateGiants() {
  const rows = [];
  for (const file of listMdFiles(path.join(CONTENT, "shoulders-of-giants"))) {
    const { data, content } = readEntry(file);
    const slug = slugFromFile(file, data);
    rows.push({
      slug,
      topic: asStringArray(data.topic),
      book_title: data.book_title ? String(data.book_title) : null,
      author: data.author ? String(data.author) : null,
      publisher: data.publisher ? String(data.publisher) : null,
      published_year: data.published_year != null ? String(data.published_year) : null,
      citation_override: data.citation_override
        ? String(data.citation_override)
        : null,
      // Only send when present — column may not exist until migration is applied.
      ...(data.source_url
        ? { source_url: String(data.source_url) }
        : {}),
      body_html: mdToHtml(content),
      status: "published",
      published_at: new Date().toISOString(),
    });
  }
  await upsert("shoulders_of_giants", rows);
}

function parseProjects(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p) => p && typeof p === "object" && "title" in p);
}

async function migrateExperience() {
  const rows = [];
  for (const file of listMdFiles(path.join(CONTENT, "experience"))) {
    const { data, content } = readEntry(file);
    const slug = slugFromFile(file, data);
    const start = toDateOnly(data.start_date);
    if (!start) {
      console.warn(`  skip experience (no start_date): ${slug}`);
      continue;
    }
    const end = toDateOnly(data.end_date);
    rows.push({
      slug,
      organization: String(data.organization ?? data.title ?? slug),
      employment_type: data.employment_type
        ? String(data.employment_type)
        : null,
      title: String(data.title ?? data.organization ?? slug),
      role: data.role ? String(data.role) : null,
      start_date: start,
      end_date: end,
      business: data.business ? String(data.business) : null,
      employee_count: data.employee_count
        ? String(data.employee_count)
        : null,
      capital: data.capital ? String(data.capital) : null,
      note: data.note ? String(data.note) : null,
      summary: data.summary ? String(data.summary) : "",
      body_html: mdToHtml(content),
      projects: parseProjects(data.projects),
      sort_order: Number(data.sort_order ?? 0) || 0,
      status: "published",
      published_at: toIso(data.start_date),
    });
  }
  await upsert("experience", rows);
}

async function migratePhotoGallery(table: "smile" | "jumpai" | "kuikake") {
  const rows = [];
  for (const file of listMdFiles(path.join(CONTENT, table))) {
    const { data, content } = readEntry(file);
    const slug = slugFromFile(file, data);
    const date = toIso(data.date);
    const imgFromFm =
      typeof data.image === "string"
        ? data.image
        : typeof data.image_url === "string"
          ? data.image_url
          : null;
    const imgMatch = content.match(/src=["']([^"']+)["']/);
    rows.push({
      slug,
      title: String(data.title ?? slug),
      date,
      location: data.location ? String(data.location) : null,
      camera: data.camera ? String(data.camera) : null,
      image_url: imgFromFm ?? imgMatch?.[1] ?? null,
      photo_tag: asStringArray(data.photo_tag ?? data.tags),
      body_html: mdToHtml(content),
      status: "published",
      published_at: date,
    });
  }
  await upsert(table, rows);
}

async function migrateSmile() {
  await migratePhotoGallery("smile");
}

async function migrateJumpai() {
  await migratePhotoGallery("jumpai");
}

async function migrateKuikake() {
  await migratePhotoGallery("kuikake");
}

async function migrateChronicle() {
  const rows = [];
  for (const file of listMdFiles(path.join(CONTENT, "chronicle"))) {
    const { data, content } = readEntry(file);
    const slug = slugFromFile(file, data);
    const date = toDateOnly(data.date) ?? "2000-01-01";
    const precisionRaw = String(data.date_precision ?? "day").toLowerCase();
    const date_precision =
      precisionRaw === "year" || precisionRaw === "month" ? precisionRaw : "day";
    rows.push({
      slug,
      title: String(data.title ?? slug),
      date,
      date_precision,
      end_date: toDateOnly(data.end_date),
      category: data.category ? String(data.category) : null,
      subcategory: data.subcategory ? String(data.subcategory) : null,
      chronicle_tag: asStringArray(data.chronicle_tag),
      description: data.description ? String(data.description) : null,
      body_html: mdToHtml(content),
      status: "published",
      published_at: toIso(data.date),
    });
  }
  await upsert("chronicle", rows);
}

async function migrateUidg() {
  const root = path.join(CONTENT, "ui-design-guidebook");
  const rows = [];
  for (const file of listMdFiles(root)) {
    const { data, content } = readEntry(file);
    const slug = slugFromFile(file, data);
    const rel = path.relative(root, file);
    let section = "other";
    if (rel.startsWith("components")) section = "components";
    else if (rel.startsWith("patterns")) section = "patterns";
    else if (rel.startsWith("principles")) section = "principles";
    else if (slug === "purpose" || slug === "structure" || file.endsWith("_index.md"))
      section = "readme";
    const tags = asStringArray(data.ui_design_guidebook_tag ?? data.tags);
    rows.push({
      slug,
      section,
      title: String(data.title ?? slug),
      description: data.description ? String(data.description) : null,
      tags,
      sort_order: typeof data.order === "number" ? data.order : 0,
      body_html: mdToHtml(content),
      status: "published",
      published_at: toIso(data.date),
    });
  }
  await upsert("ui_design_guidebook", rows);
}

async function main() {
  const only = process.argv[2]; // e.g. `tsx … experience`
  console.log(
    only
      ? `Migrating content → Supabase (only: ${only})…\n`
      : "Migrating content → Supabase…\n",
  );

  const run = async (name: string, fn: () => Promise<void>) => {
    if (only && only !== name) return;
    await fn();
  };

  await run("about", migrateAbout);
  await run("media_coverage", migrateMediaCoverage);
  await run("diary", migrateDiary);
  await run("column", migrateColumn);
  await run("work", migrateWork);
  await run("giants", migrateGiants);
  await run("experience", migrateExperience);
  await run("smile", migrateSmile);
  await run("jumpai", migrateJumpai);
  await run("kuikake", migrateKuikake);
  await run("chronicle", migrateChronicle);
  await run("uidg", migrateUidg);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
