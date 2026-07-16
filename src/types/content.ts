export type ContentStatus = "draft" | "published" | "archived";

export type About = {
  id: string;
  slug: string;
  title: string;
  body_html: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MediaCoverage = {
  id: string;
  slug: string;
  title: string;
  date: string | null;
  lead: string | null;
  external_url: string | null;
  body_html: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Diary = {
  id: string;
  slug: string;
  date: string;
  diary_month: string[];
  diary_tag: string[];
  diary_place: string | null;
  body_html: string;
  /** Markdown source for admin editing (may be empty for legacy rows). */
  body_md?: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Column = {
  id: string;
  slug: string;
  title: string;
  date: string;
  column_month: string[];
  column_category: string[];
  column_tag: string[];
  body_html: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkKind = "product" | "commission" | "involvement";

export type Work = {
  id: string;
  slug: string;
  title: string;
  date: string;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  work_category: string[];
  work_tag: string[];
  work_kind: WorkKind;
  /** Flagship product hub key, e.g. "chooning" */
  product_key: string | null;
  role: string | null;
  client: string | null;
  agency: string | null;
  body_html: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Project note inside an Experience period (Creative link deferred). */
export type ExperienceProject = {
  title: string;
  description?: string;
};

/**
 * Career / involvement period — when / where / role.
 * Separate from Creative (`work`).
 */
export type Experience = {
  id: string;
  slug: string;
  organization: string;
  employment_type: string | null;
  title: string;
  role: string | null;
  start_date: string;
  end_date: string | null;
  summary: string;
  body_html: string;
  projects: ExperienceProject[];
  sort_order: number;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ShouldersOfGiants = {
  id: string;
  slug: string;
  topic: string[];
  book_title: string | null;
  author: string | null;
  publisher: string | null;
  published_year: string | null;
  citation_override: string | null;
  body_html: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Curated photograph in Smile or Jumpai gallery. */
export type Photo = {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string | null;
  camera: string | null;
  image_url: string | null;
  photo_tag: string[];
  body_html: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Chronicle = {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: string | null;
  subcategory: string | null;
  chronicle_tag: string[];
  description: string | null;
  body_html: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UiDesignGuidebook = {
  id: string;
  slug: string;
  section: "components" | "patterns" | "principles" | "readme" | "other";
  title: string;
  description: string | null;
  tags: string[];
  sort_order: number;
  body_html: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TopImage = {
  id: string;
  slug: string;
  image_url: string;
  alt: string | null;
  sort_order: number;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Web clip / memo bookmark (short; long writing belongs in Column). */
export type Clip = {
  id: string;
  slug: string;
  title: string;
  source_url: string;
  date: string;
  memo: string;
  clip_tag: string[];
  /** Cached Open Graph image URL */
  og_image: string;
  /** Cached Open Graph description */
  og_description: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_REVALIDATE_SECONDS = 60;
