import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import type { Experience, ExperienceProject } from "@/types/content";

const CONTENT_ROOT = path.join(process.cwd(), "content", "experience");

function mdToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

function parseProjects(raw: unknown): ExperienceProject[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as Record<string, unknown>;
      const title = String(o.title ?? "").trim();
      if (!title) return null;
      const description = o.description
        ? String(o.description).trim()
        : undefined;
      return { title, description };
    })
    .filter(Boolean) as ExperienceProject[];
}

/** gray-matter may coerce YAML dates to Date objects. */
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

export function readExperienceMarkdown(slug: string): Experience | null {
  const file = path.join(CONTENT_ROOT, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    const now = new Date().toISOString();
    const start = toDateOnly(data.start_date ?? data.date);
    if (!start) return null;
    const end = toDateOnly(data.end_date);
    return {
      id: `fs-${slug}`,
      slug,
      organization: String(data.organization ?? data.title ?? slug),
      employment_type: data.employment_type
        ? String(data.employment_type)
        : null,
      title: String(data.title ?? data.organization ?? slug),
      role: data.role ? String(data.role) : null,
      start_date: start,
      end_date: end,
      summary: data.summary ? String(data.summary) : "",
      body_html: mdToHtml(content),
      projects: parseProjects(data.projects),
      sort_order: Number(data.sort_order ?? 0) || 0,
      status: "published",
      published_at: now,
      created_at: now,
      updated_at: now,
    };
  } catch (e) {
    console.error(`[readExperienceMarkdown:${slug}]`, e);
    return null;
  }
}

export function listExperienceMarkdown(): Experience[] {
  if (!fs.existsSync(CONTENT_ROOT)) return [];
  return fs
    .readdirSync(CONTENT_ROOT)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => readExperienceMarkdown(f.replace(/\.md$/, "")))
    .filter(Boolean)
    .sort((a, b) => {
      const cmp = b!.start_date.localeCompare(a!.start_date);
      if (cmp !== 0) return cmp;
      return (a!.sort_order ?? 0) - (b!.sort_order ?? 0);
    }) as Experience[];
}
