import Link from "next/link";
import { emptyColumnFilter, serializeColumnFilter } from "@/lib/content/column-filter";
import { emptyWorkFilter, serializeWorkFilter } from "@/lib/content/work-filter";
import { cn } from "@/lib/cn";
import { tagPillClass } from "@/lib/site/tag-styles";

type Props = {
  tags: string[];
  hrefFor: (tag: string) => string;
  /** 選択中ならそのタグをクリックで一覧へ戻す */
  allHref?: string;
  selected?: string | string[] | null;
  title?: string;
};

export function diaryTagHref(tag: string) {
  return `/diary_tag/${encodeURIComponent(tag)}/`;
}

export function columnTagHref(tag: string) {
  return `/column/${serializeColumnFilter({
    ...emptyColumnFilter(),
    tags: [tag],
  })}`;
}

export function workTagHref(tag: string) {
  return `/works/creative/${serializeWorkFilter({
    ...emptyWorkFilter(),
    tags: [tag],
  })}`;
}

/**
 * 読み物ページ右側のタグ（Medium の Recommended topics 相当）。
 * PC（≥1080）のみ。SiteShell の aside スロットから出す。
 */
export function ReadingTopicsAside({
  tags,
  hrefFor,
  allHref,
  selected = null,
  title = "Tags",
}: Props) {
  const sorted = [...tags].sort((a, b) => a.localeCompare(b, "ja"));
  if (!sorted.length) return null;

  const selectedSet = new Set(
    selected == null ? [] : Array.isArray(selected) ? selected : [selected],
  );

  return (
    <div>
      <p className="m-0 mb-3 text-sm font-semibold tracking-tight text-foreground">
        {title}
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {sorted.map((tag) => {
          const active = selectedSet.has(tag);
          return (
            <li key={tag} className="min-w-0">
              <Link
                href={active && allHref ? allHref : hrefFor(tag)}
                className={cn(tagPillClass(active), "max-w-full")}
              >
                <span className="truncate">{tag}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
