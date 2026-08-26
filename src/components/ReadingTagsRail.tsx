"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Tags, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ReadingTagsContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  panelId: string;
};

const ReadingTagsContext = createContext<ReadingTagsContextValue | null>(
  null,
);

function useReadingTags() {
  const ctx = useContext(ReadingTagsContext);
  if (!ctx) {
    throw new Error("ReadingTagsToggle/Panel must be inside ReadingTagsProvider");
  }
  return ctx;
}

export function ReadingTagsProvider({
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
    <ReadingTagsContext.Provider value={{ open, setOpen, panelId }}>
      {children}
    </ReadingTagsContext.Provider>
  );
}

function TagsLabel() {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 text-foreground">
      <Tags
        className="h-3.5 w-3.5 shrink-0"
        strokeWidth={2}
        aria-hidden
      />
      <span className="text-sm">Tags</span>
    </span>
  );
}

/** ヘッダー右。PC のみ。カラムが開いているときは出さない。 */
export function ReadingTagsToggle() {
  const { open, setOpen, panelId } = useReadingTags();
  if (open) return null;

  return (
    <button
      type="button"
      className={cn(
        "relative hidden shrink-0 cursor-pointer items-center justify-center",
        "appearance-none border-0 bg-transparent p-0 shadow-none outline-none",
        "hover:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-[1080px]:inline-flex",
      )}
      aria-label="タグを開く"
      aria-expanded={false}
      aria-controls={panelId}
      onClick={() => setOpen(true)}
    >
      <TagsLabel />
    </button>
  );
}

/** ヘッダー直下でも上に出す。body へ portal してヘッダーより前面に重ねる。 */
function TagsCloseButton({ onClose }: { onClose: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tip, setTip] = useState<{ left: number; top: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!tip) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 350);
    return () => window.clearTimeout(timer);
  }, [tip]);

  function show() {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTip({ left: rect.left + rect.width / 2, top: rect.top });
  }

  function hide() {
    setTip(null);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={cn(
          "relative hidden h-7 w-7 shrink-0 items-center justify-center",
          "appearance-none rounded-full border-0 bg-transparent p-0 shadow-none outline-none",
          "cursor-pointer text-foreground",
          "opacity-0 transition-[opacity,background-color] hover:bg-accent",
          "group-hover/tags-rail:opacity-100 group-focus-within/tags-rail:opacity-100",
          "focus-visible:opacity-100 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "[@media(hover:none)]:opacity-100",
          "min-[1080px]:inline-flex",
        )}
        aria-label="Close"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={onClose}
      >
        <X className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      </button>
      {tip
        ? createPortal(
            <span
              className={cn(
                "pointer-events-none fixed z-[80] whitespace-nowrap rounded px-2 py-0.5",
                "bg-foreground text-[0.75rem] leading-[1.25] text-background",
                "transition-[opacity,transform] duration-[220ms]",
                visible ? "opacity-100" : "opacity-0",
              )}
              style={{
                left: tip.left,
                top: tip.top - 4,
                transform: visible
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, calc(-100% + 4px)) scale(0.96)",
              }}
            >
              Close
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

export function ReadingTagsPanel({ children }: { children: ReactNode }) {
  const { open, setOpen, panelId } = useReadingTags();
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
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2",
          "min-[1080px]:px-4 min-[1080px]:pt-3 min-[1280px]:px-6 min-[1280px]:pt-4",
        )}
      >
        <TagsLabel />
        <TagsCloseButton onClose={() => setOpen(false)} />
      </div>
      <div
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-y-auto",
          "min-[1080px]:px-4 min-[1080px]:pb-5 min-[1080px]:pt-4",
          "min-[1280px]:px-6 min-[1280px]:pb-6",
        )}
      >
        {children}
      </div>
    </aside>
  );
}
