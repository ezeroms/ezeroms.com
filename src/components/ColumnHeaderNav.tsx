import Link from "next/link";

export const COLUMN_CATEGORY_NAMES: Record<string, string> = {
  announcements: "お知らせ",
  music: "音楽",
  "manga-and-anime": "漫画・アニメ",
  "movies-and-dramas": "映画・ドラマ",
  comedy: "お笑い",
  gaming: "ゲーム",
  sports: "スポーツ",
  "books-and-magazines": "本・雑誌",
  politics: "政治",
  "economy-and-business": "経済・ビジネス",
  languages: "言葉・言語",
  "foreign-cultures": "海外文化",
  "design-and-creative": "デザイン・クリエイティブ",
  "internet-and-technology": "インターネット・技術",
  "natural-science": "自然科学",
  "humanities-and-social-sciences": "人文・社会科学",
  "product-development": "プロダクト開発・サービス運営",
};

type Props = {
  categories: string[];
  currentCategory?: string;
  isListPage?: boolean;
};

export function ColumnHeaderNav({
  categories,
  currentCategory,
  isListPage,
}: Props) {
  return (
    <div className="column-header">
      <nav className="column-header__nav" id="column-category-filters">
        <Link
          href="/column/"
          className={`column-header__tab${!currentCategory && isListPage ? " active" : ""}`}
          data-category="all"
        >
          すべて
        </Link>
        {[...categories].sort().map((cat) => {
          const label = COLUMN_CATEGORY_NAMES[cat] ?? cat;
          const active = currentCategory === cat;
          return (
            <Link
              key={cat}
              href={`/column_category/${cat}/`}
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
