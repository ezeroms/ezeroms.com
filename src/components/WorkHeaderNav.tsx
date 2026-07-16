import Link from "next/link";

export const WORK_CATEGORY_NAMES: Record<string, string> = {
  webapp: "Webサービス / Webアプリケーション",
  mobileapp: "スマートフォンアプリ",
  website: "Webサイト",
  graphic: "グラフィック・印刷物",
  video: "映像",
};

export const WORK_CATEGORY_ORDER = [
  "webapp",
  "website",
  "graphic",
  "video",
  "mobileapp",
] as const;

export function sortWorkCategories(categories: string[]): string[] {
  const set = new Set(categories);
  const ordered = WORK_CATEGORY_ORDER.filter((c) => set.has(c));
  const rest = [...set].filter((c) => !ordered.includes(c as (typeof WORK_CATEGORY_ORDER)[number])).sort();
  return [...ordered, ...rest];
}

type Props = {
  categories: string[];
  currentCategory?: string;
  isListPage?: boolean;
};

export function WorkHeaderNav({
  categories,
  currentCategory,
  isListPage,
}: Props) {
  const sorted = sortWorkCategories(categories);

  return (
    <div className="column-header">
      <nav className="column-header__nav" id="work-category-filters">
        <Link
          href="/work/"
          className={`column-header__tab${!currentCategory && isListPage ? " active" : ""}`}
          data-category="all"
        >
          すべて
        </Link>
        {sorted.map((cat) => {
          const label = WORK_CATEGORY_NAMES[cat];
          if (!label) return null;
          const active = currentCategory === cat;
          return (
            <Link
              key={cat}
              href={`/work_category/${cat}/`}
              className={`column-header__tab${active ? " active" : ""}`}
              data-category={cat}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
