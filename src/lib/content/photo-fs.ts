import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import type { Photo } from "@/types/content";

function contentRoot(gallery: PhotoGalleryId): string {
  return path.join(process.cwd(), "content", gallery);
}

function mdToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

function asStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return [String(v)].filter(Boolean);
}

function toIso(v: unknown): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
  if (v != null && v !== "") {
    const d = new Date(String(v));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function firstImageSrc(htmlOrMd: string, front?: unknown): string | null {
  if (typeof front === "string" && front.trim()) return front.trim();
  const m = htmlOrMd.match(/src=["']([^"']+)["']/);
  return m?.[1] ?? null;
}

export function readPhotoMarkdown(
  gallery: PhotoGalleryId,
  slug: string,
): Photo | null {
  const file = path.join(contentRoot(gallery), `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    const now = new Date().toISOString();
    const date = toIso(data.date);
    const body_html = mdToHtml(content);
    const image_url = firstImageSrc(content, data.image ?? data.image_url);
    return {
      id: `fs-${gallery}-${slug}`,
      slug,
      title: String(data.title ?? slug),
      date,
      location: data.location ? String(data.location) : null,
      camera: data.camera ? String(data.camera) : null,
      image_url,
      photo_tag: asStringArray(data.photo_tag ?? data.tags),
      body_html,
      status: "published",
      published_at: date,
      created_at: now,
      updated_at: now,
    };
  } catch (e) {
    console.error(`[readPhotoMarkdown:${gallery}:${slug}]`, e);
    return null;
  }
}

export function listPhotoMarkdown(gallery: PhotoGalleryId): Photo[] {
  const root = contentRoot(gallery);
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => readPhotoMarkdown(gallery, f.replace(/\.md$/, "")))
    .filter(Boolean)
    .sort((a, b) => b!.date.localeCompare(a!.date)) as Photo[];
}
