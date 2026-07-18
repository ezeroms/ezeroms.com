"use client";

import { Share2 } from "lucide-react";
import { cn } from "@/lib/cn";

/** スマホ等で Web Share API を優先するか（PC では常にクリップボード） */
function prefersNativeShare() {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
  return window.matchMedia("(pointer: coarse)").matches;
}

function showCopiedNotification() {
  const el = document.getElementById("notification");
  if (!el) return;
  el.className = "notification show";
  window.setTimeout(() => {
    el.className = "notification";
  }, 3000);
}

type Props = {
  /** Path after origin, e.g. `/diary/slug/` or `/shoulders-of-giants/slug/` */
  path: string;
  className?: string;
};

export function DiaryShareButton({ path, className }: Props) {
  async function shareOrCopyLink() {
    const url = `${window.location.origin}${path}`;

    if (prefersNativeShare()) {
      try {
        await navigator.share({ url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showCopiedNotification();
    } catch {
      // clipboard API が使えない環境では何もしない
    }
  }

  return (
    <button
      type="button"
      className={cn(
        "diary-share-btn relative inline-flex shrink-0 items-center justify-center rounded-full border-0 bg-transparent",
        "h-9 w-9 cursor-pointer text-foreground transition-[opacity,background-color]",
        "opacity-30 group-hover:opacity-100",
        "hover:bg-accent",
        className,
      )}
      onClick={() => void shareOrCopyLink()}
      aria-label="Share"
      data-tooltip="Share"
    >
      <Share2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
