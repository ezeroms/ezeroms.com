export type ContentStatus = "draft" | "published" | "archived";

export type About = {
  id: string;
  slug: string;
  title: string;
  body_html: string;
  /** OGP image URL (recommended 1200×630). */
  og_image: string;
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
  /** OGP image URL (recommended 1200×630). */
  og_image: string;
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
  /** OGP image URL (recommended 1200×630). */
  og_image: string;
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
  /** OGP image URL (recommended 1200×630). Also used as list thumb when set. */
  og_image: string;
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
  /** OGP image URL (recommended 1200×630); falls back to image_url when empty. */
  og_image: string;
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

/** Project / engagement inside an Experience period. */
export type ExperienceProject = {
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string | null;
  role?: string;
  team_scale?: string;
  tasks?: string[];
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
  /** 事業内容など */
  business: string | null;
  /** 従業員数の表示用文字列 */
  employee_count: string | null;
  /** 資本金の表示用文字列 */
  capital: string | null;
  /** 補足（売却・社名変更など） */
  note: string | null;
  summary: string;
  body_html: string;
  projects: ExperienceProject[];
  sort_order: number;
  /** OGP image URL (recommended 1200×630). */
  og_image: string;
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
  /** External source URL for the citation (optional). */
  source_url: string | null;
  body_html: string;
  /** OGP image URL (recommended 1200×630). */
  og_image: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Curated photograph in Smile / Jampai / Kuikake gallery. */
export type Photo = {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string | null;
  camera: string | null;
  /** オリジナル画像（ライトボックス・詳細用） */
  image_url: string | null;
  /** 一覧用の軽量サムネ。未設定時は image_url にフォールバック */
  image_thumb_url: string | null;
  photo_tag: string[];
  body_html: string;
  status: ContentStatus;
  /** 論理削除フラグ。true のとき一覧・公開から除外 */
  is_deleted?: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChronicleDatePrecision = "year" | "month" | "day";

export type Chronicle = {
  id: string;
  slug: string;
  title: string;
  date: string;
  /** Display precision for `date` (year / month / day). */
  date_precision: ChronicleDatePrecision;
  /** When set, the event spans `date` … `end_date`. */
  end_date: string | null;
  category: string | null;
  subcategory: string | null;
  chronicle_tag: string[];
  description: string | null;
  body_html: string;
  /** OGP image URL (recommended 1200×630). */
  og_image: string;
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
  /** OGP image URL (recommended 1200×630). */
  og_image: string;
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
