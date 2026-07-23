import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import type { About, MediaCoverage } from "@/types/content";

const CONTENT_ROOT = path.join(process.cwd(), "content", "about");

function mdToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

/** Fallback when Supabase about rows are missing. */
export function readAboutMarkdown(slug: string): About | null {
  const file = path.join(CONTENT_ROOT, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    const now = new Date().toISOString();
    return {
      id: `fs-${slug}`,
      slug,
      title: String(data.title ?? slug),
      body_html: mdToHtml(content),
      body_md: content,
      og_image: "",
      status: "published",
      published_at: now,
      created_at: now,
      updated_at: now,
    };
  } catch (e) {
    console.error(`[readAboutMarkdown:${slug}]`, e);
    return null;
  }
}

export function listAboutMarkdown(): About[] {
  if (!fs.existsSync(CONTENT_ROOT)) return [];
  return fs
    .readdirSync(CONTENT_ROOT)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => readAboutMarkdown(f.replace(/\.md$/, "")))
    .filter(Boolean) as About[];
}

/** Fallback media coverage from Hugo markdown. */
export function listMediaCoverageMarkdown(): MediaCoverage[] {
  const dir = path.join(CONTENT_ROOT, "media-coverage");
  if (!fs.existsSync(dir)) return [];
  const now = new Date().toISOString();
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => {
      const file = path.join(dir, f);
      const raw = fs.readFileSync(file, "utf8");
      const { data, content } = matter(raw);
      const slug = f.replace(/\.md$/, "");
      return {
        id: `fs-${slug}`,
        slug,
        title: String(data.title ?? slug),
        date: data.date ? String(data.date).slice(0, 10) : null,
        lead: data.lead ? String(data.lead) : null,
        external_url: data.external_url ? String(data.external_url) : null,
        body_html: mdToHtml(content),
        og_image: "",
        status: "published" as const,
        published_at: now,
        created_at: now,
        updated_at: now,
      };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}
