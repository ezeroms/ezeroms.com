"use client";

import { Tag } from "lucide-react";
import {
  sidebarNavItemClass,
  sidebarSectionLabelClass,
} from "@/lib/site/nav-styles";
import { cn } from "@/lib/cn";
import type { TagNavSection } from "@/lib/workspace/tags";

type Props = {
  sections: TagNavSection[];
  selectedTag: string | null;
  countForTag: (tag: string) => number;
  onSelect: (tag: string) => void;
};

export function WorkspaceTagsNav({
  sections,
  selectedTag,
  countForTag,
  onSelect,
}: Props) {
  if (sections.length === 0) return null;

  return (
    <nav className="flex flex-col gap-0.5">
      {sections.map((section) => (
        <div key={section.id ?? "ungrouped"}>
          <p className={cn(sidebarSectionLabelClass, "mt-5")}>
            {section.label ?? "無所属"}
          </p>
          {section.tags.map((tag) => {
            const active = selectedTag === tag;
            const count = countForTag(tag);
            return (
              <button
                key={tag}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(tag)}
                className={sidebarNavItemClass(active)}
              >
                <Tag className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{tag}</span>
                {count > 0 ? (
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
