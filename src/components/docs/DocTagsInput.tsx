"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { tagChipClass } from "@/lib/site/tag-styles";
import { parseDocTags } from "@/types/workspace";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

export function DocTagsInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "タグを追加",
  disabled = false,
  ariaLabel = "タグ",
}: Props) {
  const [draft, setDraft] = useState("");
  const tags = parseDocTags(value);

  const filteredSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return suggestions
      .filter(
        (tag) =>
          !tags.includes(tag) && tag.toLowerCase().includes(q) && tag !== draft.trim(),
      )
      .slice(0, 6);
  }, [draft, suggestions, tags]);

  function addTag(raw: string) {
    const next = parseDocTags([...tags, raw]);
    if (next.length === tags.length) return;
    onChange(next);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((item) => item !== tag));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === "、") {
      event.preventDefault();
      if (draft.trim()) addTag(draft);
      return;
    }
    if (event.key === "Backspace" && !draft && tags.length > 0) {
      event.preventDefault();
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div
        className={cn(
          "flex min-h-8 min-w-0 flex-wrap items-center gap-1.5",
          disabled && "opacity-50",
        )}
      >
        {tags.map((tag) => (
          <span key={tag} className={cn(tagChipClass(false), "inline-flex items-center gap-1")}>
            {tag}
            <button
              type="button"
              className="inline-flex size-3.5 items-center justify-center border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:text-foreground"
              aria-label={`${tag} を外す`}
              disabled={disabled}
              onClick={() => removeTag(tag)}
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) addTag(draft);
          }}
          disabled={disabled}
          placeholder={tags.length === 0 ? placeholder : ""}
          aria-label={ariaLabel}
          className="admin-input-bare h-7 min-w-[7rem] flex-1 border-0 bg-transparent px-0 text-sm text-foreground outline-none placeholder:text-muted-foreground/65"
          autoComplete="off"
        />
      </div>
      {filteredSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className={tagChipClass(false)}
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(tag);
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
