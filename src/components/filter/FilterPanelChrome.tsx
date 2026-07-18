"use client";

import { cn } from "@/lib/cn";

type HeadingProps = {
  title?: string;
};

/** FilterRail 内パネル上部の「絞り込み」見出し。 */
export function FilterPanelHeading({ title = "絞り込み" }: HeadingProps) {
  return (
    <div className="shrink-0 pb-3" data-filter-panel-title>
      <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
    </div>
  );
}

type FooterProps = {
  onApply: () => void;
  onClear: () => void;
  applyDisabled: boolean;
  showClear: boolean;
  applyLabel?: string;
  clearLabel?: string;
};

/** 絞り込み適用・クリアボタン。 */
export function FilterPanelFooter({
  onApply,
  onClear,
  applyDisabled,
  showClear,
  applyLabel = "絞り込み",
  clearLabel = "クリア",
}: FooterProps) {
  return (
    <div className="mt-auto shrink-0 space-y-2 border-t border-border pt-3">
      <button
        type="button"
        className={cn(
          "w-full rounded-md border-0 px-4 py-2.5 text-sm font-semibold",
          "bg-primary text-primary-foreground",
          "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
        )}
        onClick={onApply}
        disabled={applyDisabled}
      >
        {applyLabel}
      </button>
      {showClear ? (
        <button
          type="button"
          className={cn(
            "w-full rounded-md border border-border bg-transparent px-4 py-2.5 text-sm",
            "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
          onClick={onClear}
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}
