import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { parseExperienceProjects } from "@/lib/content/experience-meta";
import type { Experience } from "@/types/content";

const CONTENT_ROOT = path.join(process.cwd(), "content", "experience");

function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

/** gray-matter が YAML の日付を Date に変換することがあるので、YYYY-MM-DD に揃える。 */
function toDateOnly(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const asString = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(asString)) return asString.slice(0, 10);
  const parsed = new Date(asString);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

export function readExperienceMarkdown(slug: string): Experience | null {
  const filePath = path.join(CONTENT_ROOT, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
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
      business: data.business ? String(data.business) : null,
      employee_count: data.employee_count
        ? String(data.employee_count)
        : null,
      capital: data.capital ? String(data.capital) : null,
      note: data.note ? String(data.note) : null,
      summary: data.summary ? String(data.summary) : "",
      body_html: markdownToHtml(content),
      projects: parseExperienceProjects(data.projects),
      sort_order: Number(data.sort_order ?? 0) || 0,
      og_image: "",
      status: "published",
      published_at: now,
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    console.error(`[readExperienceMarkdown:${slug}]`, error);
    return null;
  }
}

export function listExperienceMarkdown(): Experience[] {
  if (!fs.existsSync(CONTENT_ROOT)) return [];
  return fs
    .readdirSync(CONTENT_ROOT)
    .filter((fileName) => fileName.endsWith(".md") && !fileName.startsWith("_"))
    .map((fileName) =>
      readExperienceMarkdown(fileName.replace(/\.md$/, "")),
    )
    .filter(Boolean)
    .sort((a, b) => {
      const byStart = b!.start_date.localeCompare(a!.start_date);
      if (byStart !== 0) return byStart;
      return (a!.sort_order ?? 0) - (b!.sort_order ?? 0);
    }) as Experience[];
}
