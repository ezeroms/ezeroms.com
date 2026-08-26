import Link from "next/link";
import { cn } from "@/lib/cn";
import { tagPillClass } from "@/lib/site/tag-styles";

type Props = {
  tags: string[];
  hrefFor: (tag: string) => string;
  /** 選択中ならそのタグをクリックで一覧へ戻す */
  allHref?: string;
  selected?: string | string[] | null;
};

/**
 * 読み物ページ右側のタグ一覧。PC（≥1080）のみ。SiteShell の aside から出す。
 */
export function ReadingTagsAside({
  tags,
  hrefFor,
  allHref,
  selected = null,
}: Props) {
  const sorted = [...tags].sort((a, b) => a.localeCompare(b, "ja"));
  if (!sorted.length) return null;

  const selectedSet = new Set(
    selected == null ? [] : Array.isArray(selected) ? selected : [selected],
  );

  return (
    <div>
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
