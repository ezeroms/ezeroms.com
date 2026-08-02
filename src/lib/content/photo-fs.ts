import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import type { PhotoGalleryId } from "@/lib/content/photo-galleries";
import type { Photo } from "@/types/content";

function galleryContentDirectory(gallery: PhotoGalleryId): string {
  return path.join(process.cwd(), "content", gallery);
}

function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return [String(value)].filter(Boolean);
}

function toIsoDateString(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (value != null && value !== "") {
    const parsed = new Date(String(value));
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

/** front matter の image を優先し、なければ本文中の最初の src を使う。 */
function resolveImageUrl(
  bodyMarkdown: string,
  frontMatterImage: unknown,
): string | null {
  if (typeof frontMatterImage === "string" && frontMatterImage.trim()) {
    return frontMatterImage.trim();
  }
  const match = bodyMarkdown.match(/src=["']([^"']+)["']/);
  return match?.[1] ?? null;
}

export function readPhotoMarkdown(
  gallery: PhotoGalleryId,
  slug: string,
): Photo | null {
  const filePath = path.join(galleryContentDirectory(gallery), `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    const now = new Date().toISOString();
    const date = toIsoDateString(data.date);
    const body_html = markdownToHtml(content);
    const image_url = resolveImageUrl(content, data.image ?? data.image_url);
    const image_thumb_url =
      typeof data.image_thumb === "string" && data.image_thumb.trim()
        ? data.image_thumb.trim()
        : typeof data.image_thumb_url === "string" && data.image_thumb_url.trim()
          ? data.image_thumb_url.trim()
          : null;
    return {
      id: `fs-${gallery}-${slug}`,
      slug,
      title: String(data.title ?? slug),
      date,
      location: data.location ? String(data.location) : null,
      camera: data.camera ? String(data.camera) : null,
      image_url,
      image_thumb_url,
      photo_tag: asStringArray(data.photo_tag ?? data.tags),
      body_html,
      status: "published",
      published_at: date,
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    console.error(`[readPhotoMarkdown:${gallery}:${slug}]`, error);
    return null;
  }
}

export function listPhotoMarkdown(gallery: PhotoGalleryId): Photo[] {
  const directory = galleryContentDirectory(gallery);
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith(".md") && !fileName.startsWith("_"))
    .map((fileName) =>
      readPhotoMarkdown(gallery, fileName.replace(/\.md$/, "")),
    )
    .filter(Boolean)
    .sort((a, b) => b!.date.localeCompare(a!.date)) as Photo[];
}
