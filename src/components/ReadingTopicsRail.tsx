"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { Tags, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ReadingTopicsContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  panelId: string;
};

const ReadingTopicsContext = createContext<ReadingTopicsContextValue | null>(
  null,
);

function useReadingTopics() {
  const ctx = useContext(ReadingTopicsContext);
  if (!ctx) {
    throw new Error("ReadingTopicsToggle/Panel must be inside ReadingTopicsProvider");
  }
  return ctx;
}

export function ReadingTopicsProvider({
  children,
  defaultOpen = false,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <ReadingTopicsContext.Provider value={{ open, setOpen, panelId }}>
      {children}
    </ReadingTopicsContext.Provider>
  );
}

/** ヘッダー右。PC のみ。カラムが開いているときは出さない。 */
export function ReadingTopicsToggle() {
  const { open, setOpen, panelId } = useReadingTopics();
  if (open) return null;

  return (
    <button
      type="button"
      className={cn(
        "relative hidden shrink-0 cursor-pointer items-center justify-center gap-1.5",
        "appearance-none border-0 bg-transparent p-0 shadow-none outline-none",
        "text-foreground hover:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-[1080px]:inline-flex min-[1080px]:h-7 min-[1080px]:w-auto",
      )}
      aria-label="タグを開く"
      aria-expanded={false}
      aria-controls={panelId}
      onClick={() => setOpen(true)}
    >
      <Tags
        className="h-3.5 w-3.5 shrink-0"
        strokeWidth={2}
        aria-hidden
      />
      <span className="text-sm">Tags</span>
    </button>
  );
}

export function ReadingTopicsPanel({ children }: { children: ReactNode }) {
  const { open, setOpen, panelId } = useReadingTopics();
  if (!open) return null;

  return (
    <aside
      id={panelId}
      className={cn(
        "group/tags-rail relative hidden min-h-0 shrink-0",
        "min-[1080px]:flex min-[1080px]:w-[clamp(14rem,20vw,20rem)] min-[1080px]:flex-col",
      )}
      aria-label="Tags"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-border min-[1080px]:block"
        aria-hidden
      />
      <button
        type="button"
        className={cn(
          "absolute right-2 top-2 z-10 hidden h-7 w-7 items-center justify-center",
          "appearance-none border-0 bg-transparent p-0 shadow-none outline-none",
          "cursor-pointer text-foreground",
          "opacity-0 transition-opacity hover:text-muted-foreground",
          "group-hover/tags-rail:opacity-100 group-focus-within/tags-rail:opacity-100",
          "focus-visible:opacity-100 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "[@media(hover:none)]:opacity-100",
          "min-[1080px]:inline-flex",
        )}
        aria-label="タグを閉じる"
        onClick={() => setOpen(false)}
      >
        <X className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      </button>
      <div
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-y-auto",
          "min-[1080px]:px-4 min-[1080px]:py-5 min-[1280px]:px-6 min-[1280px]:py-6",
        )}
      >
        {children}
      </div>
    </aside>
  );
}
